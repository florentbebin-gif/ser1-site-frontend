import type { ReactElement } from 'react';

import type { MementoChapterEditorial } from '@/domain/settings-memento/editorial';

export default function MementoEditorialRow({
  editorial,
}: {
  editorial: MementoChapterEditorial;
}): ReactElement {
  return (
    <article className="settings-memento-row settings-memento-row--editorial">
      <div className="settings-memento-row__main">
        <div className="settings-memento-row__heading">
          <h4 className="settings-memento-row__title">À retenir</h4>
          <span className="settings-memento-source-chip">Lecture</span>
        </div>
        <p className="settings-memento-row__description">{editorial.summary}</p>
        <ul className="settings-memento-editorial-list">
          {editorial.keyPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
