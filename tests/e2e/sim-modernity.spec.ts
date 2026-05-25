import { expect, test } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';

test.describe('Modernité simulateurs', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
  });

  test('affiche les squelettes et le focus ring partagé dans le design system', async ({
    page,
  }) => {
    await page.goto('/settings/design-system');

    await expect(page.getByRole('heading', { name: 'Modernité' })).toBeVisible();
    await expect(page.locator('.sim-skeleton-card')).toBeVisible();
    await expect(page.locator('.sim-skeleton-kpi')).toBeVisible();

    const action = page.getByRole('button', { name: 'Ajouter une ligne' });
    for (let index = 0; index < 30; index += 1) {
      if (await action.evaluate((element) => element === document.activeElement)) {
        break;
      }
      await page.keyboard.press('Tab');
    }

    await expect(action).toBeFocused();
    await expect(action).toHaveCSS('box-shadow', /rgb/);
  });

  test('ouvre et ferme un terme du glossaire avec Echap', async ({ page }) => {
    await page.goto('/settings/design-system');

    const pfu = page.getByRole('button', { name: 'Définition : PFU' }).first();
    await pfu.click();

    const tooltip = page.getByRole('tooltip').filter({ hasText: 'Prélèvement forfaitaire unique' });
    await expect(tooltip).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
  });
});
