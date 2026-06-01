import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

type TokenGroup = {
  title: string;
  kind: 'space' | 'radius' | 'font' | 'motion';
  tokens: Array<{ name: string; preview: string; value: string }>;
};

const tokenGroups: TokenGroup[] = [
  {
    title: 'Espacements',
    kind: 'space',
    tokens: [
      { name: '--space-1', preview: 'var(--space-1)', value: '3 px' },
      { name: '--space-2', preview: 'var(--space-2)', value: '6 px' },
      { name: '--space-3', preview: 'var(--space-3)', value: '9 px' },
      { name: '--space-4', preview: 'var(--space-4)', value: '12 px' },
      { name: '--space-5', preview: 'var(--space-5)', value: '16 px' },
      { name: '--space-6', preview: 'var(--space-6)', value: '20 px' },
      { name: '--space-7', preview: 'var(--space-7)', value: '28 px' },
      { name: '--space-8', preview: 'var(--space-8)', value: '40 px' },
    ],
  },
  {
    title: 'Rayons',
    kind: 'radius',
    tokens: [
      { name: '--radius-sm', preview: 'var(--radius-sm)', value: '4 px' },
      { name: '--radius-md', preview: 'var(--radius-md)', value: '8 px' },
      { name: '--radius-lg', preview: 'var(--radius-lg)', value: '12 px' },
      { name: '--radius-full', preview: 'var(--radius-full)', value: '9999 px' },
    ],
  },
  {
    title: 'Typographie',
    kind: 'font',
    tokens: [
      { name: '--font-size-xs', preview: 'var(--font-size-xs)', value: '8 px' },
      { name: '--font-size-sm', preview: 'var(--font-size-sm)', value: '10 px' },
      { name: '--font-size-md', preview: 'var(--font-size-md)', value: '11 px' },
      { name: '--font-size-lg', preview: 'var(--font-size-lg)', value: '13 px' },
      { name: '--font-size-xl', preview: 'var(--font-size-xl)', value: '15 px' },
      { name: '--font-size-2xl', preview: 'var(--font-size-2xl)', value: '18 px' },
      { name: '--font-size-3xl', preview: 'var(--font-size-3xl)', value: '22 px' },
    ],
  },
  {
    title: 'Mouvement',
    kind: 'motion',
    tokens: [
      { name: '--transition-fast', preview: 'var(--transition-fast)', value: '150 ms' },
      { name: '--transition-base', preview: 'var(--transition-base)', value: '220 ms' },
      { name: '--transition-slow', preview: 'var(--transition-slow)', value: '320 ms' },
    ],
  },
];

const previewStyles = {
  root: {
    display: 'grid',
    gap: 'var(--space-6)',
    width: 720,
    color: 'var(--color-c1)',
    fontFamily: 'var(--font-sans)',
  },
  section: {
    display: 'grid',
    gap: 'var(--space-3)',
  },
  grid: {
    display: 'grid',
    gap: 'var(--space-3)',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  },
  item: {
    display: 'grid',
    gap: 'var(--space-2)',
    minHeight: 112,
    alignContent: 'start',
    padding: 'var(--space-3)',
    border: '1px solid var(--color-c8)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-card)',
  },
  sample: {
    display: 'grid',
    placeItems: 'center',
    background: 'var(--surface-active)',
    color: 'var(--color-c1)',
    fontWeight: 'var(--font-weight-semibold)',
  },
  code: {
    color: 'var(--color-c9)',
    fontSize: 'var(--font-size-sm)',
  },
  value: {
    fontSize: 'var(--font-size-md)',
  },
} satisfies Record<string, CSSProperties>;

function TokensPreview() {
  return (
    <div style={previewStyles.root} aria-label="Tokens du design system">
      {tokenGroups.map((group) => (
        <section style={previewStyles.section} key={group.title}>
          <h2>{group.title}</h2>
          <div style={previewStyles.grid}>
            {group.tokens.map((token) => (
              <article style={previewStyles.item} key={token.name}>
                <div
                  style={{
                    ...previewStyles.sample,
                    width: group.kind === 'space' ? token.preview : 'var(--space-8)',
                    height: group.kind === 'space' ? token.preview : 'var(--space-7)',
                    borderRadius: group.kind === 'radius' ? token.preview : 'var(--radius-md)',
                    fontSize: group.kind === 'font' ? token.preview : 'var(--font-size-md)',
                    transition:
                      group.kind === 'motion'
                        ? `transform ${token.preview} var(--easing-standard)`
                        : undefined,
                  }}
                >
                  Aa
                </div>
                <span style={previewStyles.code}>{token.name}</span>
                <strong style={previewStyles.value}>{token.value}</strong>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const meta = {
  title: 'Design system/Tokens',
  component: TokensPreview,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TokensPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Fondations: Story = {};
