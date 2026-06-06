// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { getLegalReference } from '@/domain/legal-references';
import settingsReferenceChain from '@/domain/settings-references/chain.json';
import {
  INCOME_TAX_BAREME_BLOCK_CLAIM_KEYS,
  INCOME_TAX_BAREME_BLOCK_REF_IDS,
  INCOME_TAX_DOM_ABATEMENT_CLAIM_KEYS,
  INCOME_TAX_DOM_ABATEMENT_REF_IDS,
  INCOME_TAX_IFI_BLOCK_CLAIM_KEYS,
  INCOME_TAX_IFI_BLOCK_REF_IDS,
} from '@/domain/settings-references/uiReferenceGroups';
import ImpotsAbattementDomSection from '../Impots/ImpotsAbattementDomSection';
import ImpotsBaremeSection from '../Impots/ImpotsBaremeSection';
import ImpotsIfiSection from '../Impots/ImpotsIfiSection';
import type { IncomeTaxSettings } from '../Impots/ImpotsBaremeYearColumn';

interface SettingsReferenceBindingFixture {
  claimKey: string;
  refIds?: string[];
}

const incomeTax: IncomeTaxSettings = {
  currentYearLabel: '2026 (revenus 2025)',
  previousYearLabel: '2025 (revenus 2024)',
  scaleCurrent: [
    { from: 0, to: 11600, rate: 0 },
    { from: 11601, to: 29579, rate: 11 },
  ],
  scalePrevious: [
    { from: 0, to: 11497, rate: 0 },
    { from: 11498, to: 29315, rate: 11 },
  ],
  quotientFamily: {
    current: {
      plafondPartSup: 1807,
      'plafondParentIsol\u00e9DeuxPremi\u00e8resParts': 4262,
    },
    previous: {
      plafondPartSup: 1791,
      'plafondParentIsol\u00e9DeuxPremi\u00e8resParts': 4224,
    },
  },
  decote: {
    current: {
      triggerSingle: 1964,
      triggerCouple: 3248,
      amountSingle: 889,
      amountCouple: 1470,
      ratePercent: 45.25,
    },
    previous: {
      triggerSingle: 1929,
      triggerCouple: 3191,
      amountSingle: 873,
      amountCouple: 1444,
      ratePercent: 45.25,
    },
  },
  abat10: {
    current: { plafond: 14426, plancher: 504 },
    previous: { plafond: 14171, plancher: 495 },
    retireesCurrent: { plafond: 4321, plancher: 450 },
    retireesPrevious: { plafond: 4243, plancher: 442 },
  },
};

const domIncomeTax: ComponentProps<typeof ImpotsAbattementDomSection>['incomeTax'] = {
  currentYearLabel: '2026 (revenus 2025)',
  previousYearLabel: '2025 (revenus 2024)',
  domAbatement: {
    current: {
      gmr: { ratePercent: 30, cap: 2450 },
      guyane: { ratePercent: 40, cap: 4050 },
    },
    previous: {
      gmr: { ratePercent: 30, cap: 2450 },
      guyane: { ratePercent: 40, cap: 4050 },
    },
  },
};

const ifiSettings: ComponentProps<typeof ImpotsIfiSection>['ifi'] = {
  current: {
    threshold: 1_300_000,
    residencePrincipaleAbattementRate: 30,
    scale: [
      { from: 0, to: 800_000, rate: 0 },
      { from: 800_000, to: null, rate: 0.5 },
    ],
  },
};

function getExpectedRefIds(claimKeys: readonly string[]): string[] {
  return Array.from(
    new Set(
      claimKeys.flatMap((claimKey) => {
        const binding = (settingsReferenceChain as SettingsReferenceBindingFixture[]).find(
          (candidate) => candidate.claimKey === claimKey,
        );
        return binding?.refIds ?? [];
      }),
    ),
  );
}

describe('ImpotsBaremeSection', () => {
  it('affiche les références cliquables du bloc barème pour N et N-1', () => {
    const expectedRefIds = getExpectedRefIds(INCOME_TAX_BAREME_BLOCK_CLAIM_KEYS);
    expect([...INCOME_TAX_BAREME_BLOCK_REF_IDS]).toEqual(expectedRefIds);

    const { container } = render(
      <ImpotsBaremeSection
        incomeTax={incomeTax}
        updateField={vi.fn()}
        updateIncomeScale={vi.fn()}
        isAdmin={false}
        openSection="bareme"
        setOpenSection={vi.fn()}
      />,
    );

    expect(screen.getByText('Références :')).toBeInTheDocument();

    const hrefs = Array.from(container.querySelectorAll('.legal-ref-link')).map((link) =>
      link.getAttribute('href'),
    );
    expect(hrefs).toEqual(
      INCOME_TAX_BAREME_BLOCK_REF_IDS.map((id) => getLegalReference(id).officialUrl),
    );
  });
});

describe('ImpotsAbattementDomSection', () => {
  it('affiche les références cliquables du bloc DOM pour N et N-1', () => {
    const expectedRefIds = getExpectedRefIds(INCOME_TAX_DOM_ABATEMENT_CLAIM_KEYS);
    expect([...INCOME_TAX_DOM_ABATEMENT_REF_IDS]).toEqual(expectedRefIds);

    const { container } = render(
      <ImpotsAbattementDomSection
        incomeTax={domIncomeTax}
        updateField={vi.fn()}
        isAdmin={false}
        openSection="dom"
        setOpenSection={vi.fn()}
      />,
    );

    expect(screen.getByText('Références :')).toBeInTheDocument();

    const hrefs = Array.from(container.querySelectorAll('.legal-ref-link')).map((link) =>
      link.getAttribute('href'),
    );
    expect(hrefs).toEqual(
      INCOME_TAX_DOM_ABATEMENT_REF_IDS.map((id) => getLegalReference(id).officialUrl),
    );
  });
});

describe('ImpotsIfiSection', () => {
  it('affiche les références cliquables du bloc IFI', () => {
    const expectedRefIds = getExpectedRefIds(INCOME_TAX_IFI_BLOCK_CLAIM_KEYS);
    expect([...INCOME_TAX_IFI_BLOCK_REF_IDS]).toEqual(expectedRefIds);

    const { container } = render(
      <ImpotsIfiSection
        ifi={ifiSettings}
        updateField={vi.fn()}
        isAdmin={false}
        openSection="ifi"
        setOpenSection={vi.fn()}
      />,
    );

    expect(screen.getByText('Références :')).toBeInTheDocument();

    const hrefs = Array.from(container.querySelectorAll('.legal-ref-link')).map((link) =>
      link.getAttribute('href'),
    );
    expect(hrefs).toEqual(
      INCOME_TAX_IFI_BLOCK_REF_IDS.map((id) => getLegalReference(id).officialUrl),
    );
  });
});
