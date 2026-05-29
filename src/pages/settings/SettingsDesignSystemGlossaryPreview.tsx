import { SimTooltip } from '@/components/ui/sim';
import { CGP_GLOSSARY_ENTRIES } from '@/constants/cgpGlossary';

export function SettingsDesignSystemGlossaryPreview() {
  return (
    <div className="settings-design-system__glossary-grid">
      {CGP_GLOSSARY_ENTRIES.map((entry) => (
        <article className="settings-design-system__ui-card" key={entry.id}>
          <SimTooltip label={entry.label} description={entry.description} />
          <p className="settings-design-system__glossary-description">{entry.description}</p>
        </article>
      ))}
    </div>
  );
}
