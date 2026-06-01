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
      await expect(situation).toBeVisible({ timeout: 15_000 });
      await situation.click();
      await page.getByRole('option', { name: /Mari/ }).click();
      await expect(situation).toContainText(/Mari/);
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
          await gotoVisualPage(page, pageDef.path, pageDef.ready);
          await waitForSimulatorContentReady(page);

          if (state === 'filled' && pageDef.fill) {
            await pageDef.fill(page);
            await waitForVisualStability(page);
          }

          await waitForFonts(page);
          await maskDossierRail(page);
          await maskFloatingSynthesisCta(page);
          await waitForVisualStability(page);
          if (pageDef.slug === 'placement' && viewport.name === 'mobile') {
            await expectNoHorizontalOverflow(page);
          }

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

test('placement comparaison mobile', async ({ page }) => {
  await enableE2EMode(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await gotoVisualPage(page, ROUTES.placement, (targetPage) =>
    targetPage.getByTestId('placement-page'),
  );
  await waitForSimulatorContentReady(page);

  await fillPlacementAge(page, '45');
  await page.getByRole('button', { name: /Comparer un autre placement/ }).click();
  await expect(page.getByRole('button', { name: 'Retirer le 2e placement' })).toBeVisible();

  await waitForFonts(page);
  await maskDossierRail(page);
  await maskFloatingSynthesisCta(page);
  await waitForVisualStability(page);
  await expectNoHorizontalOverflow(page);

  await expect(page).toHaveScreenshot('placement-compare-mobile.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixelRatio: 0.02,
  });
});

test('masque le CTA synthèse flottant avant capture', async ({ page }) => {
  await enableE2EMode(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await gotoVisualPage(page, ROUTES.credit, (targetPage) => targetPage.getByTestId('credit-page'));
  await waitForSimulatorContentReady(page);

  await fillIfVisible(page.getByTestId('credit-capital-input'), '200000');
  await waitForVisualStability(page);

  const floatingCta = page.locator('.sim-view-synthesis-cta--floating');
  await expect(floatingCta.first()).toBeVisible({ timeout: 15_000 });

  await maskFloatingSynthesisCta(page);

  await expect(floatingCta.first()).toHaveCSS('visibility', 'hidden');
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

async function gotoVisualPage(page: Page, path: string, ready: (_page: Page) => Locator) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toContainText('Application error');
  await expect(ready(page)).toBeVisible({ timeout: 15_000 });
}

async function waitForSimulatorContentReady(page: Page) {
  const loadingIndicators = page.locator(
    [
      '.sim-page-skeleton',
      '.sim-skeleton',
      '.cv-skeleton',
      '.ir-settings-loading',
      '.sc-settings-loading',
      '.sim-state-card--loading',
      '[data-testid$="-loading"]',
    ].join(', '),
  );

  await expect(loadingIndicators).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByText(/Chargement/)).toHaveCount(0, { timeout: 15_000 });
  await waitForVisualStability(page);
}

async function fillPlacementAge(page: Page, value: string) {
  const ageField = page
    .locator('.pl-client-card .pl-field')
    .filter({ hasText: 'Âge actuel' })
    .locator('input');

  await fillIfVisible(ageField, value);
}

async function waitForFonts(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

async function waitForVisualStability(page: Page) {
  await waitForFonts(page);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  await page.waitForTimeout(250);
}

async function maskFloatingSynthesisCta(page: Page) {
  const visibleAfterMask = await page
    .locator('.sim-view-synthesis-cta--floating')
    .evaluateAll((elements) => {
      for (const element of elements) {
        if (element instanceof HTMLElement) {
          element.style.visibility = 'hidden';
        }
      }
      return elements.filter((element) => getComputedStyle(element).visibility !== 'hidden').length;
    });

  if (visibleAfterMask > 0) {
    throw new Error('Le CTA synthèse flottant reste visible après application du masque visuel');
  }
}

async function maskDossierRail(page: Page) {
  await page.addStyleTag({
    content: `
      .dossier-rail-column {
        display: none !important;
      }
    `,
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(1);
}
