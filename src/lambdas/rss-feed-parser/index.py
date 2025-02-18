import requests
import xml.etree.ElementTree as ET
import boto3
import os
from datetime import datetime
import pytz
import re
import hashlib

DATA_TABLE_NAME = 'SportsScheduleData'
CONFIG_TABLE_NAME = 'SportsScheduleConfig'
dynamodb = boto3.resource('dynamodb')
data_table = dynamodb.Table(DATA_TABLE_NAME)
config_table = dynamodb.Table(CONFIG_TABLE_NAME)

SCHOOL_SPORT_ATTR = 'SchoolSport'
RSS_FEED_URL_ATTR = 'RSSFeedURL'
GAME_ID_ATTR = 'GameID'
LOCAL_START_DATE_ATTR = 'localstartdate'
TITLE_ATTR = 'title'
DESCRIPTION_ATTR = 'description'
LINK_ATTR = 'link'
OPPONENT_ATTR = 'opponent'
LOCATION_ATTR = 'location'
RESULT_ATTR = 'result'
GAME_DATE_TIME_ATTR = 'gameDateTime'
SPORT_ATTR = 'sport'

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def parse_game_item(item, sport_name):
    game_data = {}
    try:
        item_str = ET.tostring(item).decode() # For detailed logging
        print(f"parse_game_item: Processing item: {item_str}")

        title = item.find('title').text if item.find('title') is not None else 'No Title'
        description = item.find('description').text if item.find('description') is not None else 'No Description'
        link = item.find('link').text if item.find('link') is not None else 'No Link'

        game_data[TITLE_ATTR] = title.strip()
        game_data[DESCRIPTION_ATTR] = description.strip()
        game_data[LINK_ATTR] = link.strip()
        game_data[SPORT_ATTR] = sport_name

        date_time_match = re.search(r'([A-Za-z]{3}\s?\d{1,2}\s?\(...\))/?(\d{1,2}:\d{2}\s?[AP]M)?', title)
        game_datetime_str = None
        if date_time_match:
            date_part = date_time_match.group(1)
            time_part = date_time_match.group(2)
            year = datetime.now().year
            date_string = f"{date_part} {year}"
            try:
                game_datetime_utc = datetime.strptime(date_string, '%b %d (%a) %Y').replace(tzinfo=pytz.utc)
            except ValueError:
                try:
                    game_datetime_utc = datetime.strptime(date_string, '%b %d %Y').replace(tzinfo=pytz.utc)
                except ValueError:
                    game_datetime_utc = None
            if game_datetime_utc and time_part:
                time_str_24hr = datetime.strptime(time_part.strip(), '%I:%M %p').strftime('%H:%M:%S')
                game_datetime_str = f"{game_datetime_utc.date().isoformat()}T{time_str_24hr}Z"
            elif game_datetime_utc:
                game_datetime_str = game_datetime_utc.date().isoformat()
        game_data[GAME_DATE_TIME_ATTR] = game_datetime_str

        opponent = "TBD"
        location = "TBD"
        result = "Pending"

        # Location and Opponent Extraction - Improved Robustness
        title_lower = title.lower()
        description_lower = description.lower()

        if " at " in title_lower:
            location = "Away"
            opponent_match_title = re.search(r'at\s+([\w\s\'&.-]+)', title, re.IGNORECASE)
            if opponent_match_title:
                opponent = opponent_match_title.group(1).strip()
        elif " vs\.?" in title_lower: # Added optional period after vs
            location = "Home"
            opponent_match_title = re.search(r'vs\.?\s+([\w\s\'&.-]+)', title, re.IGNORECASE)
            if opponent_match_title:
                opponent = opponent_match_title.group(1).strip()
        elif " at " in description_lower: # Fallback to description
            location = "Away"
            opponent_match_desc = re.search(r'at\s+([\w\s\'&.-]+)', description, re.IGNORECASE)
            if opponent_match_desc:
                opponent = opponent_match_desc.group(1).strip()
        elif " vs\.?" in description_lower: # Fallback to description, optional period after vs
            location = "Home"
            opponent_match_desc = re.search(r'vs\.?\s+([\w\s\'&.-]+)', description, re.IGNORECASE)
            if opponent_match_desc:
                opponent = opponent_match_desc.group(1).strip()
        else: # More generic opponent extraction if "vs" or "at" not found
            title_parts = title.split(' vs ') # Split by ' vs ' first
            if len(title_parts) == 2:
                opponent = title_parts[1].strip()
                location = "Home"
                if "at " in title_parts[0].lower(): # Check for 'at ' in the first part for away games
                    location = "Away"
                    opponent = title_parts[0].replace("at ", "").strip()
            else: # If ' vs ' split fails, try splitting by ' at '
                title_parts_at = title.split(' at ')
                if len(title_parts_at) == 2:
                    location = "Away"
                    opponent = title_parts_at[1].strip()
                else: # If no 'vs' or 'at', opponent is the whole title (for events like "Triton Fall Invitational")
                    opponent = title.strip()
                    location = "Home" # Default to home if location is ambiguous


        game_data[OPPONENT_ATTR] = opponent.strip()
        game_data[LOCATION_ATTR] = location.strip()
        print(f"Location and Opponent Final Values: Location: '{game_data[LOCATION_ATTR]}', Opponent: '{game_data[OPPONENT_ATTR]}'")

        # Result Extraction - Refined Regex and Logging
        result_match_title = re.search(r'\[([WL])\]\s*([\d]+-[\d]+)', title, re.IGNORECASE) # More precise regex for title
        if result_match_title:
            result_string = result_match_title.group(0).strip()
            result_outcome = result_match_title.group(1).upper() # Capture W or L
            result_score = result_match_title.group(2) # Capture score
            result = f"[{result_outcome}], {result_score}"
            print(f"Result Extraction (Title): SUCCESS - Result: '{result}', Matched String: '{result_string}', Title: '{title}'")
        else:
            # Refined regex for description - more robust to whitespace and variations
            result_match_desc = re.search(r'\[([WL])\]\s*([\d]+-[\d]+)', description, re.IGNORECASE) # More precise regex for description
            if result_match_desc:
                result_string = result_match_desc.group(0).strip()
                result_outcome = result_match_desc.group(1).upper() # Capture W or L
                result_score = result_match_desc.group(2) # Capture score
                result = f"[{result_outcome}], {result_score}"
                print(f"Result Extraction (Description): SUCCESS - Result: '{result}', Matched String: '{result_string}', Description: '{description}'")
            else:
                print(f"Result Extraction: FAIL - No result found in title or description. Title: '{title}', Description: '{description}'")
                result = "Pending" # Ensure default value if no result found

        game_data[RESULT_ATTR] = result


    except Exception as parse_error:
        print(f"Error parsing item: {item.find('title').text if item.find('title') is not None else 'No Title'}. Item XML: {item_str}. Error: {parse_error}")
        return None

    game_id_value = game_data.get(LINK_ATTR)
    if not game_id_value or game_id_value == 'No Link':
        game_id_base = f"{game_data.get(TITLE_ATTR, 'no-title')}-{game_data.get(GAME_DATE_TIME_ATTR, 'no-date')}"
        game_id_hash = hashlib.md5(game_id_base.encode()).hexdigest()
        game_id_value = game_id_hash
        print(f"GameID generated as Hash: {game_id_value} (Base: '{game_id_base}')") # Log when hash is generated
    else:
        print(f"GameID extracted from Link: {game_id_value}") # Log when GameID is from link
    game_data[GAME_ID_ATTR.strip()] = game_id_value.strip()

    return game_data

def store_game_data(game_data):
    try:
        if game_data and GAME_ID_ATTR.strip() in game_data:
            game_id_to_store = game_data[GAME_ID_ATTR.strip()] # Extract GameID for logging clarity
            print(f"store_game_data: game_data about to be stored for GameID: {game_id_to_store}. Data: {game_data}") # Log GameID before storage
            existing_item = data_table.get_item(Key={GAME_ID_ATTR.strip(): game_id_to_store}).get('Item') # Check for existing item
            if not existing_item: # Store only if item doesn't exist
                data_table.put_item(Item=game_data)
                print(f"Stored game data for GameID: {game_id_to_store}")
            else:
                print(f"Duplicate GameID detected: {game_id_to_store}. Item not stored.") # Log duplicate detection
        else:
            print("store_game_data was called with incomplete game_data (missing gameid), skipping storage.")
    except Exception as e:
        game_id_error = game_data.get(GAME_ID_ATTR.strip(), 'N/A') # Get GameID even if error occurs
        print(f"Error storing game data to DynamoDB for GameID: {game_id_error}. Error: {e}")


def lambda_handler(event, context):
    print("Starting RSS feed processing...")

    try:
        config_response = config_table.scan()
        config_items = config_response.get('Items', [])

        if not config_items:
            print("No configurations found in SportsScheduleConfig table.")
            return {
                'statusCode': 200,
                'body': '{"message": "No configurations found."}'
            }

        all_games = []
        for config in config_items:
            school_sport = config.get(SCHOOL_SPORT_ATTR)
            rss_feed_url = config.get(RSS_FEED_URL_ATTR)

            if not school_sport or not rss_feed_url:
                print(f"Skipping config due to missing SchoolSport or RSSFeedURL: {config}")
                continue

            print(f"Processing Sport: {school_sport} from URL: {rss_feed_url}") # More specific logging

            try:
                response = requests.get(rss_feed_url, headers=headers, timeout=10)
                response.raise_for_status()
                xml_content = response.content
                root = ET.fromstring(xml_content)
                items = root.findall('.//item')

                games = []
                for item in items:
                    game_data = parse_game_item(item, school_sport)
                    if game_data:
                        games.append(game_data)
                all_games.extend(games)
                print(f"Successfully processed {school_sport}. {len(games)} games parsed.") # Log number of parsed games

            except requests.exceptions.RequestException as req_error:
                print(f"Request error for {school_sport} from {rss_feed_url}: {req_error}")
            except ET.ParseError as parse_error:
                print(f"XML Parse error for {school_sport} from {rss_feed_url}: {parse_error}")
            except Exception as processing_error:
                print(f"General processing error for {school_sport} from {rss_feed_url}: {processing_error}")

        print(f"Total games parsed across all sports: {len(all_games)}") # Log total parsed games

        stored_game_ids = set() # Track stored GameIDs to further debug duplicates
        for game_data in all_games:
            game_id = game_data.get(GAME_ID_ATTR.strip())
            if game_id in stored_game_ids:
                print(f"In-memory duplicate detected before storage for GameID: {game_id}. Not storing again.") # Log in-memory duplicate
            else:
                store_game_data(game_data)
                stored_game_ids.add(game_id)


        print("RSS feed processing completed successfully.")
        return {
            'statusCode': 200,
            'body': '{"message": "RSS feed processing completed successfully"}'
        }

    except Exception as overall_error:
        print(f"Overall Lambda function error: {overall_error}")
        return {
            'statusCode': 500,
            'body': '{"error": "An error occurred during RSS feed processing"}'
        }