import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_ANNUEL } from '@/engine/placement/versementConfig';
import { VersementAnnualSection } from '../components/VersementConfigModalSections';

const noop = () => {};

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
