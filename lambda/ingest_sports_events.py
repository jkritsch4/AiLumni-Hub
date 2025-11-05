"""AWS Lambda entrypoint for ingesting collegiate sports data.

This module replaces the previous Google Calendar-based pipeline with a
Sidearm Sports-first workflow. It automatically discovers schedule feeds,
synchronises event metadata, enriches game items with logos and dominant
colours, and keeps standings snapshots up to date in DynamoDB.  The code is
written to be idempotent so repeated Lambda invocations only persist real
changes.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import logging
import os
import re
from dataclasses import dataclass
from io import BytesIO
from typing import Dict, Iterable, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import boto3
import pytz
import requests
from bs4 import BeautifulSoup
from botocore.exceptions import ClientError
from colorthief import ColorThief
from PIL import Image
from requests import Response, Session
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

LOGGER = logging.getLogger()
if not LOGGER.handlers:
    logging.basicConfig(level=logging.INFO)
LOGGER.setLevel(logging.INFO)

AWS_REGION = os.environ.get("AWS_REGION", "us-west-2")
TABLE_NAME = os.environ.get("TABLE_NAME", "SportsEvents")
DEFAULT_TZ_NAME = os.environ.get("DEFAULT_TIMEZONE", "America/Los_Angeles")

DYNAMODB = boto3.resource("dynamodb", region_name=AWS_REGION)
TABLE = DYNAMODB.Table(TABLE_NAME)


@dataclass(frozen=True)
class TeamConfig:
    """Configuration values that describe a single athletics program."""

    name: str
    sport: str
    conference: str
    schedule_page_url: str
    rss_feed_url: str
    timezone: str = DEFAULT_TZ_NAME
    standings_path: Optional[str] = None


TEAM_CONFIGS: Tuple[TeamConfig, ...] = (
    TeamConfig(
        name="UCSD Baseball",
        sport="Baseball",
        conference="Big West Conference",
        schedule_page_url="https://ucsdtritons.com/sports/baseball/schedule",
        rss_feed_url="https://ucsdtritons.com/calendar.ashx/calendar.rss?sport_id=1&_=cm86kr66800013ja4iruxdx3a",
        standings_path="baseball",
    ),
    TeamConfig(
        name="UCSD Men's Basketball",
        sport="Basketball",
        conference="Big West Conference",
        schedule_page_url="https://ucsdtritons.com/sports/mens-basketball/schedule",
        rss_feed_url="https://ucsdtritons.com/calendar.ashx/calendar.rss?sport_id=5&_=cm7r6hmmu00023ja38hbiflel",
        standings_path="mbball",
    ),
    TeamConfig(
        name="UCSD Men's Golf",
        sport="Golf",
        conference="Big West Conference",
        schedule_page_url="https://ucsdtritons.com/sports/mens-golf/schedule",
        rss_feed_url="https://ucsdtritons.com/calendar.ashx/calendar.rss?sport_id=6&_=cm7r6fs2k00013ja2kloqxtgm",
    ),
    TeamConfig(
        name="SF State Baseball",
        sport="Baseball",
        conference="CCAA Conference",
        schedule_page_url="https://sfstategators.com/sports/baseball/schedule",
        rss_feed_url="https://sfstategators.com/calendar.ashx/calendar.rss?sport_id=2&_=cm7r6irhx00013ja4chpstlpo",
        standings_path="baseball",
    ),
    TeamConfig(
        name="USD Baseball",
        sport="Baseball",
        conference="West Coast Conference",
        schedule_page_url="https://usdtoreros.com/sports/baseball/schedule",
        rss_feed_url="https://usdtoreros.com/calendar.ashx/calendar.rss?sport_id=1&_=cm7r6guy000013ja1ulprzphf",
        standings_path="baseball",
    ),
    TeamConfig(
        name="USF Basketball",
        sport="Basketball",
        conference="West Coast Conference",
        schedule_page_url="https://usfdons.com/sports/mens-basketball/schedule",
        rss_feed_url="https://usfdons.com/calendar.ashx/calendar.rss?sport_id=3&_=cmf48ykt500023ja7xywy66y5",
        standings_path="mbball",
    ),
)

STANDINGS_SITES: Dict[str, str] = {
    "Big West Conference": "https://bigwest.org/standings.aspx",
    "West Coast Conference": "https://wccsports.com/standings.aspx",
    "CCAA Conference": "https://goccaa.org/standings.aspx",
}

# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------


def build_http_session() -> Session:
    retry_strategy = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET", "HEAD"),
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (LambdaSportsBot/1.0)"
        }
    )
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def discover_calendar_feed(session: Session, schedule_page_url: str) -> Optional[str]:
    try:
        response = session.get(schedule_page_url, timeout=10)
        response.raise_for_status()
    except requests.RequestException as exc:
        LOGGER.warning("Failed to fetch schedule page %s: %s", schedule_page_url, exc)
        return None

    soup = BeautifulSoup(response.content, "html.parser")
    for link in soup.select("a[href*='calendar.ashx']"):
        href = link.get("href")
        if not href:
            continue
        parsed = urlparse(href)
        query = parsed.query.lower()
        if "format=json" in query or "format=ical" in query or "calendar.rss" in href:
            calendar_url = urljoin(schedule_page_url, href)
            if "format=ical" in query:
                calendar_url = re.sub(r"format=ical", "format=json", calendar_url)
            elif "calendar.rss" in href:
                calendar_url = calendar_url.replace("calendar.rss", "calendar.ashx?format=json")
            LOGGER.info("Discovered schedule feed %s", calendar_url)
            return calendar_url
    LOGGER.warning("No calendar feed discovered on %s", schedule_page_url)
    return None


def fetch_json(session: Session, url: str) -> Optional[Response]:
    try:
        response = session.get(url, timeout=10)
        response.raise_for_status()
        return response
    except requests.RequestException as exc:
        LOGGER.warning("Request failed for %s: %s", url, exc)
    return None


# ---------------------------------------------------------------------------
# Event ingestion
# ---------------------------------------------------------------------------


def parse_sidearm_events(raw_events: Iterable[dict], tz: pytz.timezone) -> List[dict]:
    parsed_events: List[dict] = []
    for raw in raw_events:
        data = raw.get("event") if "event" in raw else raw
        if not isinstance(data, dict):
            continue

        guid = str(data.get("id") or data.get("guid") or data.get("gameId") or data.get("game_id") or data.get("GameID") or data.get("ContestID") or data.get("slug") or data.get("title"))
        start_str = data.get("startDate") or data.get("start") or data.get("start_date") or data.get("StartDate")
        end_str = data.get("endDate") or data.get("end") or data.get("EndDate")
        opponent = data.get("opponent") or data.get("opponentName") or data.get("Opponent") or data.get("opponent_name")
        location = data.get("location") or data.get("Location") or data.get("venue") or data.get("Site")
        summary = data.get("title") or data.get("Title") or data.get("summary") or data.get("Name")
        result = data.get("result") or data.get("Result")
        streaming = data.get("video") or data.get("streamingUrl") or data.get("stream_url")
        tickets = data.get("tickets") or data.get("ticket_url")

        start_dt = parse_datetime(start_str, tz)
        end_dt = parse_datetime(end_str, tz) if end_str else None

        if not start_dt:
            LOGGER.debug("Skipping event without start time: %s", data)
            continue

        item = {
            "guid": guid,
            "summary": summary or opponent or "TBD",
            "start": start_dt,
            "end": end_dt or (start_dt + dt.timedelta(hours=3)),
            "opponent": opponent or "TBD",
            "location": location or "TBD",
            "result": result,
            "stream": streaming,
            "tickets": tickets,
        }
        parsed_events.append(item)
    return parsed_events


def parse_datetime(value: Optional[str], tz: pytz.timezone) -> Optional[dt.datetime]:
    if not value:
        return None
    formats = (
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S%z",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    )
    for fmt in formats:
        try:
            parsed = dt.datetime.strptime(value, fmt)
            if not parsed.tzinfo:
                parsed = tz.localize(parsed)
            return parsed.astimezone(pytz.UTC)
        except ValueError:
            continue
    LOGGER.debug("Unable to parse datetime %s", value)
    return None


def extract_events_for_team(
    session: Session,
    team: TeamConfig,
    rss_events: Optional[List[dict]] = None,
) -> List[dict]:
    timezone = pytz.timezone(team.timezone)
    calendar_feed = discover_calendar_feed(session, team.schedule_page_url)
    raw_events: List[dict] = []

    if calendar_feed:
        response = fetch_json(session, calendar_feed)
        if response is not None:
            payload = response.json()
            if isinstance(payload, dict):
                raw_events = payload.get("events") or payload.get("Items") or payload.get("items") or []
            elif isinstance(payload, list):
                raw_events = payload
            LOGGER.info("Fetched %s events for %s", len(raw_events), team.name)

    if not raw_events:
        LOGGER.warning("Falling back to RSS feed for events for %s", team.name)
        if rss_events is None:
            rss_events, _, _ = extract_logos_from_rss(session, team.rss_feed_url)
        enriched = []
        for idx, event in enumerate(rss_events):
            start = parse_datetime(event.get("start_time"), timezone)
            end = parse_datetime(event.get("end_time"), timezone)
            if not start:
                continue
            enriched.append(
                {
                    "guid": event.get("guid") or f"{team.name}-{idx}",
                    "summary": event.get("title", "TBD"),
                    "start": start,
                    "end": end or (start + dt.timedelta(hours=3)),
                    "opponent": event.get("opponent") or "TBD",
                    "location": event.get("location") or "TBD",
                    "result": event.get("result"),
                    "stream": event.get("stream_link"),
                    "tickets": event.get("ticket_link"),
                }
            )
        return enriched

    return parse_sidearm_events(raw_events, timezone)


# ---------------------------------------------------------------------------
# RSS logo + metadata extraction
# ---------------------------------------------------------------------------


def extract_logos_from_rss(session: Session, rss_feed_url: str) -> Tuple[List[dict], List[str], List[str]]:
    if not rss_feed_url:
        return [], [], []

    try:
        response = session.get(rss_feed_url, timeout=10)
        response.raise_for_status()
    except requests.RequestException as exc:
        LOGGER.warning("Failed to fetch RSS feed %s: %s", rss_feed_url, exc)
        return [], [], []

    namespaces = {"s": "http://sidearmsports.com/schemas/cal_rss/1.0/"}
    soup = BeautifulSoup(response.content, "xml")
    events: List[dict] = []
    team_logo_set, opponent_logo_set = set(), set()

    for item in soup.find_all("item"):
        guid = item.find("guid")
        guid_text = guid.text.strip() if guid and guid.text else None
        start_time = item.find("s:eventstart")
        end_time = item.find("s:eventend")
        opponent = item.find("s:opponent")
        location = item.find("s:location")
        result = item.find("s:result")
        summary = item.find("title")
        stream = item.find("s:video")
        ticket = item.find("s:ticket")

        team_logo = item.find("s:teamlogo", namespaces=namespaces)
        opponent_logo = item.find("s:opponentlogo", namespaces=namespaces)

        team_logo_url = team_logo.text.strip() if team_logo and team_logo.text else None
        opponent_logo_url = opponent_logo.text.strip() if opponent_logo and opponent_logo.text else None

        if team_logo_url:
            team_logo_set.add(team_logo_url)
        if opponent_logo_url:
            opponent_logo_set.add(opponent_logo_url)

        events.append(
            {
                "guid": guid_text,
                "title": summary.text.strip() if summary and summary.text else None,
                "start_time": start_time.text.strip() if start_time and start_time.text else None,
                "end_time": end_time.text.strip() if end_time and end_time.text else None,
                "opponent": opponent.text.strip() if opponent and opponent.text else None,
                "location": location.text.strip() if location and location.text else None,
                "result": result.text.strip() if result and result.text else None,
                "stream_link": stream.text.strip() if stream and stream.text else None,
                "ticket_link": ticket.text.strip() if ticket and ticket.text else None,
                "teamLogo": team_logo_url,
                "opponentLogo": opponent_logo_url,
            }
        )
    return events, list(team_logo_set), list(opponent_logo_set)


# ---------------------------------------------------------------------------
# Colour extraction utilities
# ---------------------------------------------------------------------------


def fetch_team_colours(
    session: Session,
    team: TeamConfig,
    existing_item: Optional[dict],
    unique_team_logos: List[str],
) -> Optional[dict]:
    theme_logo = unique_team_logos[0] if unique_team_logos else None
    if not theme_logo:
        LOGGER.info("No logo found for %s; skipping colour extraction", team.name)
        return None

    if existing_item and existing_item.get("team_logo_url") == theme_logo:
        LOGGER.debug("Logo unchanged for %s; skipping colour extraction", team.name)
        return existing_item

    primary, secondary = get_dominant_colours(session, theme_logo)
    if not primary and not secondary:
        return None

    return {
        "PK": team.name,
        "SK": "TeamInfo",
        "dataType": "TeamInfo",
        "team_name": team.name,
        "sport": team.sport,
        "conference_name": team.conference,
        "team_logo_url": theme_logo,
        "primaryThemeColor": primary,
        "secondaryThemeColor": secondary or primary,
        "start_time_utc": "TEAM_INFO_DATA",
    }


def get_dominant_colours(session: Session, image_url: str) -> Tuple[Optional[str], Optional[str]]:
    try:
        response = session.get(image_url, timeout=10)
        response.raise_for_status()
    except requests.RequestException as exc:
        LOGGER.warning("Failed to download logo %s: %s", image_url, exc)
        return None, None

    if not response.headers.get("Content-Type", "").startswith("image/"):
        LOGGER.warning("URL %s did not return an image content type", image_url)
        return None, None

    image_data = response.content
    try:
        image = Image.open(BytesIO(image_data))
        image.verify()
    except Exception as exc:  # pylint: disable=broad-except
        LOGGER.warning("Logo at %s is not a valid image: %s", image_url, exc)
        return None, None

    color_thief = ColorThief(BytesIO(image_data))
    primary_rgb = color_thief.get_color(quality=1)
    palette = color_thief.get_palette(color_count=2, quality=1)

    primary_hex = "#%02x%02x%02x" % primary_rgb
    secondary_hex = primary_hex
    if palette:
        for rgb in palette:
            candidate = "#%02x%02x%02x" % rgb
            if candidate.lower() != primary_hex.lower():
                secondary_hex = candidate
                break
    return primary_hex, secondary_hex


# ---------------------------------------------------------------------------
# DynamoDB helpers
# ---------------------------------------------------------------------------


def load_existing_item(pk: str, sk: str) -> Optional[dict]:
    try:
        response = TABLE.get_item(Key={"PK": pk, "SK": sk})
    except ClientError as exc:
        LOGGER.error("DynamoDB get_item failed: %s", exc)
        return None
    return response.get("Item")


def upsert_if_changed(item: dict) -> None:
    pk, sk = item["PK"], item["SK"]
    existing = load_existing_item(pk, sk)
    if existing and items_equivalent(existing, item):
        LOGGER.debug("No changes detected for %s/%s", pk, sk)
        return
    TABLE.put_item(Item=item)
    LOGGER.info("Upserted item %s/%s", pk, sk)


def items_equivalent(old: dict, new: dict) -> bool:
    ignored = {"updatedAt"}
    old_filtered = {k: v for k, v in old.items() if k not in ignored}
    new_filtered = {k: v for k, v in new.items() if k not in ignored}
    return compute_hash(old_filtered) == compute_hash(new_filtered)


def compute_hash(payload: dict) -> str:
    encoded = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


# ---------------------------------------------------------------------------
# Standings ingestion
# ---------------------------------------------------------------------------


def ingest_standings(session: Session) -> None:
    requested: Dict[Tuple[str, str], str] = {}
    for team in TEAM_CONFIGS:
        if not team.standings_path:
            continue
        requested[(team.conference, team.standings_path)] = team.sport

    for (conference, path), sport in requested.items():
        base_url = STANDINGS_SITES.get(conference)
        if not base_url:
            continue
        url = f"{base_url}?path={path}"
        html_standings = extract_standings(session, url, conference, sport)
        for entry in html_standings:
            upsert_if_changed(entry)


def extract_standings(session: Session, url: str, conference: str, sport: str) -> List[dict]:
    response = fetch_json(session, url + "&format=json")
    standings: List[dict] = []
    if response is not None:
        try:
            payload = response.json()
            rows = payload.get("Standings") or payload.get("standings") or payload.get("items")
            if isinstance(rows, list):
                for row in rows:
                    standings.append(
                        build_standings_item(
                            conference=conference,
                            team=row.get("team") or row.get("Team") or row.get("name"),
                            sport=row.get("sport") or row.get("Sport") or sport,
                            conf_record=row.get("conferenceRecord") or row.get("ConfRecord") or row.get("conf_record"),
                            overall_record=row.get("overallRecord") or row.get("OverallRecord") or row.get("overall_record"),
                            streak=row.get("streak") or row.get("Streak"),
                        )
                    )
        except ValueError:
            LOGGER.info("Standings JSON unavailable for %s; falling back to HTML", conference)

    if standings:
        return standings

    try:
        html_response = session.get(url, timeout=10)
        html_response.raise_for_status()
    except requests.RequestException as exc:
        LOGGER.warning("Failed to load standings page %s: %s", url, exc)
        return []

    soup = BeautifulSoup(html_response.content, "html.parser")
    table = soup.select_one("table.sidearm-table.sidearm-standings-table")
    if not table:
        LOGGER.warning("No standings table found for %s", conference)
        return []

    headers = [th.text.strip() for th in table.select("thead th")]
    body_rows = table.select("tbody tr")
    conf_idx = next((i for i, h in enumerate(headers) if h in {"Conf", "Conf."}), None)
    overall_idx = headers.index("Overall") if "Overall" in headers else None
    streak_idx = headers.index("Streak") if "Streak" in headers else None

    for row in body_rows:
        team_cell = row.select_one("td.hide-on-medium-down a, td.hide-on-large a")
        if not team_cell:
            continue
        cells = [c.text.strip() for c in row.select("td")]
        conf_record = cells[conf_idx] if conf_idx is not None and conf_idx < len(cells) else None
        overall_record = cells[overall_idx] if overall_idx is not None and overall_idx < len(cells) else None
        streak = cells[streak_idx] if streak_idx is not None and streak_idx < len(cells) else None
        standings.append(
            build_standings_item(
                conference=conference,
                team=team_cell.text.strip(),
                sport=sport,
                conf_record=conf_record,
                overall_record=overall_record,
                streak=streak,
            )
        )
    return standings


def build_standings_item(
    conference: str,
    team: Optional[str],
    sport: str,
    conf_record: Optional[str],
    overall_record: Optional[str],
    streak: Optional[str],
) -> dict:
    conf_wins, conf_losses = split_record(conf_record)
    overall_wins, overall_losses = split_record(overall_record)
    item = {
        "PK": f"{team}#{sport}#Standings",
        "SK": conference,
        "dataType": "standings",
        "team_name": team,
        "sport": sport,
        "standing_type": conference,
        "conf_wins": conf_wins,
        "conf_losses": conf_losses,
        "overall_wins": overall_wins,
        "overall_losses": overall_losses,
        "streak": streak,
        "start_time_utc": "STANDINGS-DATA",
    }
    return item


def split_record(record: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    if not record:
        return None, None
    parts = record.split("-")
    if len(parts) != 2:
        return record, None
    return parts[0], parts[1]


# ---------------------------------------------------------------------------
# Lambda entrypoint
# ---------------------------------------------------------------------------


def lambda_handler(event, context):  # pylint: disable=unused-argument
    session = build_http_session()
    ingest_window_start = dt.datetime.utcnow() - dt.timedelta(days=14)
    ingest_window_end = dt.datetime.utcnow() + dt.timedelta(days=365)

    for team in TEAM_CONFIGS:
        LOGGER.info("Processing %s", team.name)
        rss_events, unique_team_logos, _ = extract_logos_from_rss(session, team.rss_feed_url)
        existing_team_info = load_existing_item(team.name, "TeamInfo")
        team_info = fetch_team_colours(session, team, existing_team_info, unique_team_logos)
        if team_info:
            upsert_if_changed(team_info)

        logo_lookup = {event.get("guid"): event for event in rss_events if event.get("guid")}

        events = extract_events_for_team(session, team, rss_events)
        for event_item in events:
            start_utc = event_item["start"]
            if start_utc < ingest_window_start.replace(tzinfo=pytz.UTC) or start_utc > ingest_window_end.replace(tzinfo=pytz.UTC):
                continue

            guid = event_item.get("guid") or f"{team.name}-{start_utc.isoformat()}"
            rss_match = logo_lookup.get(guid)
            team_logo = rss_match.get("teamLogo") if rss_match else None
            opponent_logo = rss_match.get("opponentLogo") if rss_match else None

            pk = team.name
            sk = start_utc.isoformat()
            game_outcome = normalise_result(event_item.get("result"))

            item = {
                "PK": pk,
                "SK": sk,
                "dataType": "gameResult",
                "team_name": team.name,
                "opponent_name": event_item.get("opponent") or "TBD",
                "sport": team.sport,
                "conference_name": team.conference,
                "game_outcome": game_outcome,
                "game_type": classify_game_type(event_item.get("summary")),
                "game_location": event_item.get("location") or "TBD",
                "start_time_utc": start_utc.isoformat(),
                "end_time_utc": (event_item.get("end") or start_utc).isoformat(),
                "streaming_link": event_item.get("stream"),
                "ticket_link": event_item.get("tickets"),
                "team_logo_url": team_logo,
                "opponent_logo_url": opponent_logo,
            }
            apply_score_fields(item, game_outcome)
            upsert_if_changed(item)

    ingest_standings(session)

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Sports events ingested successfully"}),
    }


# ---------------------------------------------------------------------------
# Misc helpers
# ---------------------------------------------------------------------------


def normalise_result(result: Optional[str]) -> Optional[str]:
    if not result:
        return None
    result = result.strip()
    if not result:
        return None
    shorthand = {
        "w": "Win",
        "l": "Loss",
        "t": "Tie",
    }
    if result[0].lower() in shorthand and re.match(r"^[WLT]\s*\d+-\d+", result, re.IGNORECASE):
        prefix = shorthand[result[0].lower()]
        return f"{prefix} {result[1:].strip()}"
    return result


def classify_game_type(summary: Optional[str]) -> Optional[str]:
    if not summary:
        return None
    match = re.search(r"\((.*?)\)", summary)
    return match.group(1) if match else None


def apply_score_fields(item: dict, result: Optional[str]) -> None:
    if not result:
        return
    match = re.search(r"(\d+)-(\d+)", result)
    if not match:
        return
    scores = match.groups()
    if result.lower().startswith("win"):
        item["score_team"] = int(scores[0])
        item["score_opponent"] = int(scores[1])
    elif result.lower().startswith("loss"):
        item["score_team"] = int(scores[1])
        item["score_opponent"] = int(scores[0])
    else:
        item["score_team"] = int(scores[0])
        item["score_opponent"] = int(scores[1])


if __name__ == "__main__":
    lambda_handler({}, {})
