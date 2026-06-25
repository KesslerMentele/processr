import { type FC } from "react";
import { Panel } from "@xyflow/react";
import useStats, { type ResolvedItemRate } from "../useStats.ts";


const RateRow: FC<ResolvedItemRate> = ({ name, rate }) => (
  <div className="stats-row">
    <span className="stats-item-name">{name}</span>
    <span className="stats-item-rate">{rate.toFixed(2)}/s</span>
  </div>
);

const RateSection: FC<{ label: string; items: ResolvedItemRate[] }> = ({ label, items }) => (
  <div className="stats-section">
    <div className="stats-section-label">{label}</div>
    {items.length === 0
      ? <div className="stats-empty">—</div>
      : items.map(item => <RateRow key={item.itemId} {...item} />)
    }
  </div>
);

const StatsPanel: FC = () => {
  const stats = useStats();

  return (
    <Panel position="top-left">
      <div className="canvas-panel">
        <RateSection label="Input" items={stats.input} />
        <RateSection label="Output" items={stats.output} />
      </div>
    </Panel>
  );
};

export default StatsPanel;
