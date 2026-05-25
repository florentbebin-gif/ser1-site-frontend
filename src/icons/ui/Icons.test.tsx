import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  IconBarChart,
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
  IconClose,
  IconDownload,
  IconDuplicate,
  IconGift,
  IconInfo,
  IconLayers,
  IconNetwork,
  IconPencil,
  IconPieChart,
  IconPlus,
  IconUsers,
} from './index';

type IconComponent = ComponentType<{ className?: string }>;

const newIcons: Array<[string, IconComponent]> = [
  ['IconPencil', IconPencil],
  ['IconClose', IconClose],
  ['IconChevronDown', IconChevronDown],
  ['IconChevronUp', IconChevronUp],
  ['IconPlus', IconPlus],
  ['IconDuplicate', IconDuplicate],
  ['IconGift', IconGift],
  ['IconInfo', IconInfo],
  ['IconDownload', IconDownload],
  ['IconCalendar', IconCalendar],
  ['IconUsers', IconUsers],
  ['IconLayers', IconLayers],
  ['IconNetwork', IconNetwork],
  ['IconPieChart', IconPieChart],
  ['IconBarChart', IconBarChart],
];

describe('catalogue icônes UI', () => {
  it.each(newIcons)('%s respecte le contrat SVG partagé', (_name, Icon) => {
    const html = renderToStaticMarkup(createElement(Icon, { className: 'test-icon' }));

    expect(html).toContain('class="test-icon"');
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('stroke-width="1.8"');
  });
});
