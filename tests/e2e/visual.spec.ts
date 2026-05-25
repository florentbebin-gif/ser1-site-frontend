import { expect, test, type Locator, type Page } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

type VisualPage = {
  slug: string;
  path: string;
  ready: (_page: Page) => Locator;
  fill?: (_page: Page) => Promise<void>;
};

const viewports = [
  { name: 'desktop', size: { width: 1440, height: 1000 } },
  { name: 'mobile', size: { width: 390, height: 900 } },
] as const;

const visualPages: VisualPage[] = [
  {
    slug: 'ir',
    path: ROUTES.ir,
    ready: (page) => page.getByTestId('ir-page'),
    fill: async (page) => {
      await fillIfVisible(page.getByTestId('ir-salary-d1-input'), '45000');
    },
  },
  {
    slug: 'credit',
    path: ROUTES.credit,
    ready: (page) => page.getByTestId('credit-page'),
    fill: async (page) => {
      await fillIfVisible(page.getByTestId('credit-capital-input'), '200000');
    },
  },
  {
    slug: 'succession',
    path: ROUTES.succession,
    ready: (page) => page.getByTestId('succession-page'),
    fill: async (page) => {
      const situation = page.getByRole('button', { name: 'Situation familiale' });
      if ((await situation.count()) > 0) {
        await situation.click();
        await page.getByRole('option', { name: /Mari/ }).click();
      }
    },
  },
  {
    slug: 'placement',
    path: ROUTES.placement,
    ready: (page) => page.getByTestId('placement-page'),
    fill: async (page) => {
      const ageField = page
        .locator('.pl-client-card .pl-field')
        .filter({ hasText: 'Âge actuel' })
        .locator('input');
      await fillIfVisible(ageField, '45');
    },
  },
  {
    slug: 'per-potentiel',
    path: ROUTES.perPotentiel,
    ready: (page) => page.getByRole('heading', { name: /PER\s+—\s+Potentiel/i }),
    fill: async (page) => {
      const situationField = page.getByTestId('per-situation-field').locator('input').first();
      await fillIfVisible(situationField, '45000');
    },
  },
  {
    slug: 'per-transfert',
    path: ROUTES.perTransfert,
    ready: (page) => page.getByRole('heading', { name: /transfert/i }).first(),
  },
  {
    slug: 'tresorerie-societe',
    path: ROUTES.tresorerieSociete,
    ready: (page) => page.getByRole('heading', { name: /Trésorerie société/i }),
  },
  {
    slug: 'prevoyance',
    path: ROUTES.prevoyance,
    ready: (page) => page.getByRole('heading', { name: /Prévoyance/i }),
  },
];

test.describe('Snapshots visuels simulateurs', () => {
  for (const pageDef of visualPages) {
    for (const viewport of viewports) {
      for (const state of ['empty', 'filled'] as const) {
        test(`${pageDef.slug} ${state} ${viewport.name}`, async ({ page }) => {
          await enableE2EMode(page);
          await page.setViewportSize(viewport.size);
          await page.goto(pageDef.path);
          await page.waitForLoadState('networkidle');

          await expect(page.locator('body')).not.toContainText('Application error');
          await expect(pageDef.ready(page)).toBeVisible({ timeout: 15_000 });

          if (state === 'filled' && pageDef.fill) {
            await pageDef.fill(page);
            await page.waitForTimeout(150);
          }

          await waitForFonts(page);

          await expect(page).toHaveScreenshot(`${pageDef.slug}-${state}-${viewport.name}.png`, {
            fullPage: true,
            animations: 'disabled',
            maxDiffPixelRatio: 0.02,
          });
        });
      }
    }
  }
});

async function fillIfVisible(locator: Locator, value: string) {
  if ((await locator.count()) === 0) {
    return;
  }

  const first = locator.first();
  if (!(await first.isVisible())) {
    return;
  }

  await first.fill(value);
  await first.blur();
}

async function waitForFonts(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}
