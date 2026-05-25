import { expect, test, type Page } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';

const MOBILE_TARGET = 44;

test.describe('Cibles tactiles mobiles simulateurs', () => {
  test('garantit 44 px sur boutons, champs et segments partagés', async ({ page }) => {
    await enableE2EMode(page);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/settings/design-system');

    await expect(page.getByRole('heading', { name: 'Design system simulateurs' })).toBeVisible();

    await expectMinTarget(page, '.sim-action-btn', 'bouton action');
    await expectMinTarget(page, '.sim-action-btn--icon', 'bouton icône');
    await expectMinTarget(page, '.sim-field__control', 'champ montant');
    await expectMinTarget(page, '.sim-segmented__option', 'option segmentée');
  });
});

async function expectMinTarget(page: Page, selector: string, label: string) {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, `${label} présent`).not.toBeNull();
  expect(box!.height, `${label} hauteur`).toBeGreaterThanOrEqual(MOBILE_TARGET);
  expect(box!.width, `${label} largeur`).toBeGreaterThanOrEqual(MOBILE_TARGET);
}
