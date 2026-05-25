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
    test(`affiche le footer fiscal sur ${route}`, async ({ page }) => {
      await page.goto(route);

      const auditTrail = page.locator('.sim-audit-trail');
      await expect(auditTrail).toHaveCount(1);
      await expect(auditTrail).toContainText(
        /Simulation calculée le \d{2}\/\d{2}\/\d{4} \d{2}:\d{2} · Barème IR .+ · Source Bercy/,
      );
    });
  }
});
