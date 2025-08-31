import { test, expect } from '@playwright/test';
import { TEAM_ALIASES } from '../../src/config/team-aliases';

type TeamCheck = {
  id: string;
  expectedHost: string; // domain to expect in main team logo URL
  sport: string;        // sport query param for route
  conference?: string;  // expected conference label if present
};

const MATRIX: TeamCheck[] = [
  { id: 'ucsd-mens-basketball', expectedHost: 'ucsdtritons.com', sport: 'Basketball', conference: 'Big West' },
  { id: 'sf-state', expectedHost: 'sfstategators.com', sport: 'Baseball', conference: 'CCAA' },
  { id: 'usd-baseball', expectedHost: 'usdtoreros.com', sport: 'Baseball', conference: 'West Coast Conference' },
  { id: 'usf-basketball', expectedHost: 'usfdons.com', sport: 'Basketball', conference: 'West Coast Conference' },
];

function findTeamName(id: string): string {
  const entry = (TEAM_ALIASES as any)[id];
  if (!entry) throw new Error(`Alias not found for ${id}`);
  return entry.name;
}

test.describe('Dynamic team sweep', () => {
  for (const row of MATRIX) {
    test(`Team: ${row.id}`, async ({ page }) => {
      await page.goto(`/?team_id=${row.id}&sport=${encodeURIComponent(row.sport)}`);

      // Wait for dashboard to render
      await page.waitForLoadState('networkidle');

      // 1) CSS variables for theme colors exist
      const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim());
      const secondary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim());
      expect(primary).not.toBe('');
      expect(secondary).not.toBe('');

      // 2) Main team logo src contains expected host
      const logo = page.locator('img[alt="Team Logo"], .team-logo img').first();
      await expect(logo).toBeVisible();
      const src = await logo.getAttribute('src');
      expect(src || '').toContain(row.expectedHost);

      // 3) Recent results table (if data exists) should render some rows
      const tableRows = page.locator('table tbody tr');
      const rowCount = await tableRows.count();
      // We allow zero when feed has no rows; log instead of failing
      test.info().annotations.push({ type: 'info', description: `RecentResults rows: ${rowCount}` });

      // 4) Standings table should exist and (optionally) contain expected conference label
      const standingsTitle = page.locator('text=Standings');
      await expect(standingsTitle).toBeVisible({ timeout: 10_000 });
      if (row.conference) {
        const hasConference = await page.locator(`text=${row.conference}`).first().isVisible().catch(() => false);
        test.info().annotations.push({ type: 'info', description: `Conference visible: ${hasConference}` });
      }

      // 5) UpcomingGames opponent logo or pending placeholder
      const opponentLogo = page.locator('.upcoming-game img.opponent-logo');
      const pendingBox = page.locator('.upcoming-game .pending-logo');
      const hasOpponentLogo = await opponentLogo.first().isVisible().catch(() => false);
      const hasPending = await pendingBox.first().isVisible().catch(() => false);
      expect(hasOpponentLogo || hasPending).toBeTruthy();
    });
  }
});