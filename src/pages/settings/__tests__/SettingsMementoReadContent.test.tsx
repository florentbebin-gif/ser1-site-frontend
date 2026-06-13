// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserRoleState } from '@/auth/useUserRole';

import SettingsMemento from '../SettingsMemento';

let isAdmin = false;

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: (): UserRoleState => ({
    role: isAdmin ? 'admin' : 'user',
    user: null,
    isAdmin,
    isLoading: false,
  }),
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

async function openReadPart(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = findButtonByClass('settings-memento-part__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function openReadChapter(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = findButtonByClass('settings-memento-read-chapter__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

const INTERNAL_WORDS =
  /\b(?:SER1|simulateur|simulateurs|settings|param[eè]tre|param[eè]tres|moteur|moteurs|registry)\b/i;

describe('SettingsMemento — lecture éditoriale', () => {
  beforeEach(() => {
    isAdmin = false;
  });

  it('affiche la fiscalité comme aide-mémoire de dispositifs', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openReadPart(user, 'Fiscalité');
    await openReadChapter(user, 'Fiscalité foyer');

    expect(screen.getByText('Impôt sur le revenu')).toBeInTheDocument();
    expect(screen.getByText('Revenus du capital')).toBeInTheDocument();
    expect(screen.getByText('Patrimoine immobilier taxable')).toBeInTheDocument();
    expect(container).not.toHaveTextContent(INTERNAL_WORDS);
  });

  it('affiche le droit civil comme aide-mémoire de dispositifs', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openReadPart(user, 'Droit civil');
    await openReadChapter(user, 'Foyer');

    expect(screen.getByText('Composition familiale')).toBeInTheDocument();
    expect(screen.getByText('Capacité patrimoniale')).toBeInTheDocument();
    expect(screen.getByText('Personnes à protéger')).toBeInTheDocument();

    await openReadChapter(user, 'Civil');

    expect(screen.getByText('Régimes matrimoniaux')).toBeInTheDocument();
    expect(screen.getByText('PACS et union libre')).toBeInTheDocument();
    expect(screen.getByText('Dévolution successorale')).toBeInTheDocument();
    expect(screen.getByText('Réserve et quotité disponible')).toBeInTheDocument();
    expect(container).not.toHaveTextContent(INTERNAL_WORDS);
  });

  it('affiche sociétés et placements avec leurs valeurs de référence en lecture', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Impôt sur les sociétés et placements');
    await openReadChapter(user, 'Société');

    expect(screen.getByText('Distribution et réserves')).toBeInTheDocument();
    expect(screen.getByText('Titres et opérations de capital')).toBeInTheDocument();
    expect(screen.getByText('Comptables et sociétés')).toBeInTheDocument();

    await openReadChapter(user, 'Placements');

    expect(screen.getByText('Enveloppes de placement')).toBeInTheDocument();
    expect(screen.getByText('Revenus du capital')).toBeInTheDocument();
    expect(screen.getByText('Prélèvements sociaux')).toBeInTheDocument();
    expect(screen.getByText('Référentiel contrats')).toBeInTheDocument();
  });

  it('affiche successions et libéralités avec les valeurs DMTG en lecture', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Successions et libéralités');
    await openReadChapter(user, 'Transmission');

    expect(screen.getByText('Dévolution et réserve')).toBeInTheDocument();
    expect(screen.getByText('Donations et libéralités')).toBeInTheDocument();
    expect(screen.getAllByText('Assurance-vie au décès').length).toBeGreaterThan(0);
    expect(screen.getByText('Droits de mutation')).toBeInTheDocument();
    expect(screen.getByText('Transmission, DMTG et succession')).toBeInTheDocument();

    await openReadChapter(user, 'Transmission entreprise');

    expect(screen.getAllByText('Pacte Dutreil').length).toBeGreaterThan(0);
    expect(screen.getByText('Donation de titres')).toBeInTheDocument();
    expect(screen.getByText('Paiement des droits')).toBeInTheDocument();
  });

  it('rend le lexique dans la partie dédiée', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openReadPart(user, 'Lexique');

    expect(screen.getByText('Civil et transmission')).toBeInTheDocument();
    expect(screen.getByText('Fiscalité et placements')).toBeInTheDocument();
    expect(screen.getByText('Social et retraite')).toBeInTheDocument();
    expect(screen.getByText('Acquêts')).toBeInTheDocument();
    expect(screen.getByText('Quotité disponible')).toBeInTheDocument();
    expect(screen.getByText('Plus-value')).toBeInTheDocument();
    expect(screen.getByText('PER')).toBeInTheDocument();
    expect(screen.getByText('PER individuel')).toBeInTheDocument();
    expect(container).not.toHaveTextContent(INTERNAL_WORDS);
  });
});
