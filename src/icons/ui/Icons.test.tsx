import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  IconActivity,
  IconArrowLeftRight,
  IconArrowRight,
  IconBarChart,
  IconBriefcase,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconClipboardCheck,
  IconCloud,
  IconClock,
  IconClose,
  IconDownload,
  IconDuplicate,
  IconEmptyChart,
  IconEmptyDocs,
  IconEmptyTable,
  IconFileText,
  IconGift,
  IconGauge,
  IconHardDrive,
  IconInfo,
  IconLayers,
  IconNetwork,
  IconPencil,
  IconPieChart,
  IconPlus,
  IconScanLine,
  IconShield,
  IconSliders,
  IconTable,
  IconTransfer,
  IconUpload,
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
  ['IconCheck', IconCheck],
  ['IconUsers', IconUsers],
  ['IconLayers', IconLayers],
  ['IconNetwork', IconNetwork],
  ['IconPieChart', IconPieChart],
  ['IconBarChart', IconBarChart],
  ['IconSliders', IconSliders],
  ['IconTable', IconTable],
  ['IconActivity', IconActivity],
  ['IconArrowLeftRight', IconArrowLeftRight],
  ['IconBriefcase', IconBriefcase],
  ['IconBuilding', IconBuilding],
  ['IconChevronRight', IconChevronRight],
  ['IconCloud', IconCloud],
  ['IconClock', IconClock],
  ['IconFileText', IconFileText],
  ['IconGauge', IconGauge],
  ['IconHardDrive', IconHardDrive],
  ['IconShield', IconShield],
  ['IconTransfer', IconTransfer],
  ['IconArrowRight', IconArrowRight],
  ['IconClipboardCheck', IconClipboardCheck],
  ['IconScanLine', IconScanLine],
  ['IconUpload', IconUpload],
];

const emptyIcons: Array<[string, IconComponent]> = [
  ['IconEmptyTable', IconEmptyTable],
  ['IconEmptyChart', IconEmptyChart],
  ['IconEmptyDocs', IconEmptyDocs],
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

  it.each(emptyIcons)('%s respecte le contrat illustration vide', (_name, Icon) => {
    const html = renderToStaticMarkup(createElement(Icon, { className: 'test-icon' }));

    expect(html).toContain('class="test-icon"');
    expect(html).toContain('viewBox="0 0 60 60"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('stroke="currentColor"');
  });
});
