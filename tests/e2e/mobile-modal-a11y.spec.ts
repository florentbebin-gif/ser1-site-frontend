import { expect, test } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';

test.describe('Modales mobiles simulateurs', () => {
  test('affiche une bottom-sheet mobile et garde le focus dans la modale', async ({ page }) => {
    await enableE2EMode(page);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/sim/per/transfert');

    const trigger = page.getByRole('button', { name: 'Personnaliser le calcul de rente' });
    await trigger.click();
    const modal = page.getByRole('dialog', { name: /Calcul de rente personnalisé/i });

    await expect(modal).toBeVisible();
    await expect(modal).toHaveCSS('border-radius', /14px 14px 0px 0px/);
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

    const box = await modal.boundingBox();
    expect(box, 'modale visible').not.toBeNull();
    expect(box!.height).toBeLessThanOrEqual(765);

    await page.keyboard.press('Tab');
    await expect(modal.locator(':focus')).toBeVisible();

    for (let index = 0; index < 12; index += 1) {
      await page.keyboard.press('Tab');
      const insideModal = await modal.evaluate((element) =>
        element.contains(document.activeElement),
      );
      expect(insideModal).toBe(true);
    }

    await page.keyboard.press('Shift+Tab');
    const insideModalAfterReverseTab = await modal.evaluate((element) =>
      element.contains(document.activeElement),
    );
    expect(insideModalAfterReverseTab).toBe(true);

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });
});
