# Team Switching and Aliases

This app supports dynamic team switching via a single source of truth for team aliases in `src/config/team-aliases.ts`.

## Concepts
- **team_id (URL)**: A kebab-case identifier like `usf-basketball`.
- **team_name (API/UI)**: Canonical display name like `USF Basketball`.
- **Overrides**: Optional colors and conference used only when API data is missing or inconsistent.

## How URL team selection works
1. The Dashboard reads `?team_id=...`.
2. `setCurrentTeamById()` converts `team_id` → `team_name` using the alias map.
3. Components read the current team and update theme, logos, games, and standings.
4. If `team_id` is unknown, we try slug matching against known `TeamInfo` names; otherwise we log a warning.

## Adding a new team
1. Add an entry to `TEAM_ALIASES` with `id → { name, sport, conference?, colors? }`.
2. (Optional) Provide brand colors and conference to improve UX if the API lacks them.
3. Navigate with `?team_id=<your-id>` or use the Dashboard switch function to verify.

## QA steps (example: 4 teams)
- **UCSD Men's Basketball**: expect UCSD blue/gold, Big West standings.
- **SF State Baseball**: expect Gators logo, CCAA standings.
- **USD Baseball**: expect usdtoreros.com logo, West Coast Conference.
- **USF Basketball**: expect green/gold theme, West Coast Conference.

## Gotchas
- If the feed omits colors, overrides provide a fallback; when the API later supplies colors, those take precedence.
- Standings filtering prefers explicit team conference; if none is available, it infers from the standings data.

## Current Team Aliases
The following teams are currently configured:

| team_id | team_name | sport | conference |
|---------|-----------|-------|------------|
| `ucsd` | UCSD Baseball | Baseball | Big West |
| `ucsd-mens-basketball` | UCSD Men's Basketball | Basketball | Big West |
| `sf-state` | SF State Baseball | Baseball | CCAA |
| `usd-baseball` | USD Baseball | Baseball | West Coast Conference |
| `usf-basketball` | USF Basketball | Basketball | West Coast Conference |
| `cal-poly-pomona` | Cal Poly Pomona Baseball | Baseball | CCAA |

## Testing Team Switching
Use the browser console commands available in `test-teams.js`:
- `quickCheck()` - Check current team logo
- `validateTeamLogo("UCSD Baseball")` - Test specific team
- `runCompleteValidation()` - Test all teams