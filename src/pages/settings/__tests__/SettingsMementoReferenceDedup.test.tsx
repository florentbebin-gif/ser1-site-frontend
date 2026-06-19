// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { configure, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserRoleState } from '@/auth/useUserRole';
import { getOptionalLegalReference, type LegalReferenceId } from '@/domain/legal-references';
import type { MementoEntry } from '@/domain/settings-memento';
import { MEMENTO_ENTRIES } from '@/domain/settings-memento/entries';

import SettingsMemento from '../SettingsMemento';
import {
  getEntrySectionRenderedReferenceIds,
  getEntrySourceVisibleReferenceIds,
} from '../memento/mementoReferenceDedup';

configure({ asyncUtilTimeout: 5_000 });
vi.setConfig({ testTimeout: 15_000 });

let isAdmin = true;
const fromMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
type TestUser = ReturnType<typeof userEvent.setup>;
type RoleName = RegExp | string;

const FISCALITE_FOYER_TABS = /Sections du chapitre Fiscalité foyer/i;

function makeSettingsBuilder() {
  const listResult = { data: [], error: null };
  const singleResult = { data: null, error: { code: 'PGRST116' } };
  const writeResult = { data: null, error: null };

  const builder = {} as {
    select: () => typeof builder;
    eq: () => typeof builder;
    order: () => Promise<typeof listResult>;
    maybeSingle: () => Promise<typeof singleResult>;
    upsert: () => Promise<typeof writeResult>;
    then: PromiseLike<typeof listResult>['then'];
  };

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.order = vi.fn(() => Promise.resolve(listResult));
  builder.maybeSingle = vi.fn(() => Promise.resolve(singleResult));
  builder.upsert = vi.fn(() => Promise.resolve(writeResult));
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(listResult).then(onFulfilled, onRejected);

  return builder;
}

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: (): UserRoleState => ({
    role: isAdmin ? 'admin' : 'user',
    user: null,
    isAdmin,
    isLoading: false,
  }),
}));

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
  },
}));

vi.mock('@/utils/cache/fiscalSettingsCache', () => ({
  invalidate: vi.fn(),
  broadcastInvalidation: vi.fn(),
}));

function findButtonByClass(className: string, label: string): HTMLButtonElement {
  const button = screen
    .getAllByRole('button')
    .find(
      (candidate): candidate is HTMLButtonElement =>
        candidate instanceof HTMLButtonElement &&
        candidate.classList.contains(className) &&
        candidate.textContent?.includes(label) === true,
    );

  if (!button) throw new Error(`Bouton introuvable : ${label}`);
  return button;
}

async function openReadPart(user: TestUser, label: string) {
  const button = findButtonByClass('settings-memento-part__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function openReadChapter(user: TestUser, label: string) {
  const button = findButtonByClass('settings-memento-read-chapter__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function selectMementoTab(user: TestUser, tablistName: RoleName, tabName: RoleName) {
  const tablist = await screen.findByRole('tablist', { name: tablistName });
  const tab = within(tablist).getByRole('tab', { name: tabName });
  await user.click(tab);
}

function getMementoEntry(entryKey: string): MementoEntry {
  const entry = MEMENTO_ENTRIES.find((candidate) => candidate.key === entryKey);
  if (!entry) throw new Error(`Entrée mémento introuvable : ${entryKey}`);
  return entry;
}

function getKnownReference(refId: LegalReferenceId) {
  const reference = getOptionalLegalReference(refId);
  if (!reference) throw new Error(`Référence légale introuvable : ${refId}`);
  return reference;
}

function referenceLinkName(refId: LegalReferenceId): string {
  const reference = getKnownReference(refId);
  return reference.articleOrSection ?? reference.label;
}

function findReferenceLink(
  container: HTMLElement,
  refId: LegalReferenceId,
): HTMLAnchorElement | undefined {
  const reference = getKnownReference(refId);
  const linkName = referenceLinkName(refId);
  return within(container)
    .queryAllByRole('link', { name: linkName })
    .find(
      (link): link is HTMLAnchorElement =>
        link instanceof HTMLAnchorElement && link.getAttribute('href') === reference.officialUrl,
    );
}

async function expectReferenceLinks(container: HTMLElement, refIds: readonly LegalReferenceId[]) {
  await waitFor(() => {
    for (const refId of refIds) {
      expect(findReferenceLink(container, refId), refId).toBeDefined();
    }
  });
}

function getSourceEntry(container: HTMLElement, entry: MementoEntry): HTMLElement {
  const sourceEntry = Array.from(
    container.querySelectorAll<HTMLElement>('.settings-memento-source-entry'),
  ).find((candidate) => candidate.textContent?.includes(entry.label) === true);

  if (!sourceEntry) throw new Error(`Bloc sources introuvable : ${entry.label}`);
  return sourceEntry;
}

function entryRefIdsRenderedBySection(entry: MementoEntry): LegalReferenceId[] {
  const rendered = new Set(getEntrySectionRenderedReferenceIds(entry));
  return entry.refIds.filter((refId) => rendered.has(refId));
}

describe('SettingsMemento — déduplication DOM des références', () => {
  beforeEach(() => {
    isAdmin = true;
    fromMock.mockReset();
    fromMock.mockImplementation(() => makeSettingsBuilder());
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: null, error: null });
  });

  it.each([
    {
      label: 'IR',
      partName: 'Fiscalité',
      chapterName: 'Fiscalité foyer',
      tablistName: FISCALITE_FOYER_TABS,
      entryKey: 'fiscalite-foyer.ir',
    },
    {
      label: 'IFI',
      partName: 'Fiscalité',
      chapterName: 'Fiscalité foyer',
      tablistName: FISCALITE_FOYER_TABS,
      entryKey: 'fiscalite-foyer.ifi',
    },
    {
      label: 'DMTG',
      partName: 'Successions et libéralités',
      chapterName: 'Transmission',
      tablistName: /Sections du chapitre Transmission/i,
      entryKey: 'transmission.succession-dmtg',
    },
    {
      label: 'prélèvements sociaux',
      partName: 'Impôt sur les sociétés et placements',
      chapterName: 'Placements',
      tablistName: /Sections du chapitre Placements/i,
      entryKey: 'placements.ps-pfu-revenus-capital',
    },
  ])(
    'ne répète pas dans Sources les refIds déjà visibles en paramètres ($label)',
    async ({ partName, chapterName, tablistName, entryKey }) => {
      const user = userEvent.setup();
      const { container } = render(<SettingsMemento />);
      const entry = getMementoEntry(entryKey);
      const renderedSectionRefIds = getEntrySectionRenderedReferenceIds(entry);
      const dedupedEntryRefIds = entryRefIdsRenderedBySection(entry);
      const visibleSourceRefIds = getEntrySourceVisibleReferenceIds(entry);

      expect(renderedSectionRefIds.length, entryKey).toBeGreaterThan(0);
      expect(dedupedEntryRefIds.length, entryKey).toBeGreaterThan(0);

      await openReadPart(user, partName);
      await openReadChapter(user, chapterName);

      await selectMementoTab(user, tablistName, 'Paramètres de référence');
      const parametersPanel = screen.getByRole('tabpanel', { name: 'Paramètres de référence' });
      await expectReferenceLinks(parametersPanel, renderedSectionRefIds);

      await selectMementoTab(user, tablistName, 'Sources & couverture');
      const sourceEntry = getSourceEntry(container, entry);

      for (const refId of dedupedEntryRefIds) {
        expect(findReferenceLink(sourceEntry, refId), refId).toBeUndefined();
      }
      await expectReferenceLinks(sourceEntry, visibleSourceRefIds);
    },
  );

  it('garde visibles dans Sources & couverture les références des entrées sans table dédiée', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);
    const entry = getMementoEntry('fiscalite-foyer.niches-fiscales');
    const renderedSectionRefIds = getEntrySectionRenderedReferenceIds(entry);
    const visibleSourceRefIds = getEntrySourceVisibleReferenceIds(entry);

    expect(renderedSectionRefIds).toHaveLength(0);
    expect(visibleSourceRefIds).toEqual(entry.refIds);

    await openReadPart(user, 'Fiscalité');
    await openReadChapter(user, 'Fiscalité foyer');
    await selectMementoTab(user, FISCALITE_FOYER_TABS, 'Sources & couverture');

    await expectReferenceLinks(getSourceEntry(container, entry), visibleSourceRefIds);
  });
});
