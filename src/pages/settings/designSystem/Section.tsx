import type { ReactNode } from 'react';

export function DesignSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="settings-premium-card settings-design-system__section">
      <h2 className="settings-design-system__title">{title}</h2>
      {children}
    </section>
  );
}
