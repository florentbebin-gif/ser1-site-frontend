import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_ANNUEL } from '@/engine/placement/versementConfig';
import {
  VersementAnnualSection,
  VersementPonctuelsSection,
} from '../components/VersementConfigModalSections';

const noop = () => {};
const RemoveIcon = () => <span>x</span>;

describe('VersementAnnualSection', () => {
  it('renders an empty state when no annual section is configured', () => {
    const markup = renderToStaticMarkup(
      <VersementAnnualSection
        active={false}
        annuel={DEFAULT_ANNUEL}
        isPER={false}
        isSCPI={false}
        isExpert={true}
        onAddAnnual={noop}
        onRemoveAnnual={noop}
        onUpdateAnnuel={noop}
        onUpdateAnnuelAlloc={noop}
        onUpdateAnnuelOption={noop}
      />,
    );

    expect(markup).toContain('Aucun versement annuel configure');
    expect(markup).toContain('+ Ajouter un versement annuel');
  });

  it('renders a remove action when the annual section is active', () => {
    const markup = renderToStaticMarkup(
      <VersementAnnualSection
        active={true}
        annuel={DEFAULT_ANNUEL}
        isPER={false}
        isSCPI={false}
        isExpert={true}
        onAddAnnual={noop}
        onRemoveAnnual={noop}
        onUpdateAnnuel={noop}
        onUpdateAnnuelAlloc={noop}
        onUpdateAnnuelOption={noop}
      />,
    );

    expect(markup).toContain('Supprimer');
    expect(markup).not.toContain('Aucun versement annuel configure');
  });
});

describe('VersementPonctuelsSection', () => {
  it('keeps the standard allocation display for ponctual payments', () => {
    const markup = renderToStaticMarkup(
      <VersementPonctuelsSection
        ponctuels={[{
          annee: 5,
          montant: 0,
          fraisEntree: 0.02,
          pctCapitalisation: 100,
          pctDistribution: 0,
        }]}
        dureeEpargne={10}
        isSCPI={false}
        onAddPonctuel={noop}
        onUpdatePonctuel={noop}
        onUpdatePonctuelAlloc={noop}
        onRemovePonctuel={noop}
        RemoveIcon={RemoveIcon}
      />,
    );

    expect(markup).toContain('Capitalisation');
    expect(markup).toContain('Distribution');
    expect(markup).toContain('100%');
    expect(markup).toContain('0%');
    expect(markup).not.toContain('pl-alloc-slider--compact');
  });
});
