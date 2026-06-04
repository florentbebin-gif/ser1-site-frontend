import { expect, test } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';

const simulatorRoutes = [
  '/sim/placement',
  '/sim/credit',
  '/sim/succession',
  '/sim/per/potentiel',
  '/sim/per/transfert',
  '/sim/tresorerie-societe',
  '/sim/prevoyance',
  '/sim/ir',
];

test.describe('Piste d’audit des simulateurs', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
  });

  for (const route of simulatorRoutes) {
    test(`masque le footer fiscal avant synthèse sur ${route}`, async ({ page }) => {
      await page.goto(route);

      await expect(page.locator('.sim-audit-trail')).toHaveCount(0);
    });
  }

  test('affiche le footer fiscal quand une synthèse est disponible', async ({ page }) => {
    await page.goto('/sim/credit');

    const capitalField = page.getByTestId('credit-capital-input');
    await capitalField.fill('200000');
    await capitalField.press('Tab');

    const auditTrail = page.locator('.sim-audit-trail');
    await expect(auditTrail).toHaveCount(1);
    await expect(auditTrail).toContainText(
      /Simulation calculée le \d{2}\/\d{2}\/\d{4} \d{2}:\d{2} · Barème IR .+ · Source : barème fiscal officiel/,
    );
  });
});
