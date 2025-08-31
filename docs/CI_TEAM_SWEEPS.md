# Continuous Team Sweep (E2E)

This job validates dynamic rendering for multiple teams using Playwright.

## Run locally
- npm ci
- npm run test:e2e

The Playwright webServer launches `npm run preview` on port 4173 and runs tests against `http://localhost:4173`.

## Add more teams
- Append entries to MATRIX in `tests/e2e/team-sweep.spec.ts`, or generate dynamically from `TEAM_ALIASES`.
- Prefer explicit expectedHost for the team's main logo.

## CI
- Workflow `.github/workflows/team-sweep.yml` runs on push, PRs, nightly, and manual dispatch.
- Artifacts can include traces on failures.