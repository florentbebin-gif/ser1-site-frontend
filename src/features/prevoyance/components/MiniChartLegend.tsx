export function MiniChartLegend({ showMaintien = false }: { showMaintien?: boolean }) {
  return (
    <div className="prevoyance-mini-chart__legend">
      <span>
        <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--reference" />
        Revenu
      </span>
      <span>
        <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--ro" />
        RO
      </span>
      {showMaintien ? (
        <span>
          <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--maintien" />
          empl
        </span>
      ) : null}
      <span>
        <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--contrat" />
        Contrats
      </span>
    </div>
  );
}
