interface DomRegionCfg {
  ratePercent?: number | string;
  cap?: number | string;
}

interface DomYearCfg {
  gmr?: DomRegionCfg;
  guyane?: DomRegionCfg;
}

interface DomAbatementCfgRoot {
  current?: DomYearCfg;
  previous?: DomYearCfg;
}

interface DomAbatementInput {
  location: string;
  yearKey: string;
  domAbatementCfgRoot?: DomAbatementCfgRoot;
  irAfterQf: number;
}

export function computeDomAbatementAmount({
  location,
  yearKey,
  domAbatementCfgRoot,
  irAfterQf,
}: DomAbatementInput): number {
  let domAbatementAmount = 0;

  const domCfgRoot = domAbatementCfgRoot || {};
  const domYearCfg = yearKey === 'current' ? domCfgRoot.current || {} : domCfgRoot.previous || {};

  if (location === 'gmr' || location === 'guyane') {
    const domCfg = location === 'gmr' ? domYearCfg.gmr : domYearCfg.guyane;

    const ratePercent = Number(domCfg?.ratePercent || 0);
    const cap = Number(domCfg?.cap || 0);

    if (ratePercent > 0) {
      const raw = (Number(irAfterQf) || 0) * (ratePercent / 100);
      domAbatementAmount = cap > 0 ? Math.min(raw, cap) : raw;
      domAbatementAmount = Math.max(0, domAbatementAmount);
    }
  }

  return domAbatementAmount;
}
