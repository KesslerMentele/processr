import type { FC } from "react";
import type { ProcessrNodeData } from "../../models";

interface ErrorProps {
  selected: boolean;
  data: ProcessrNodeData;
}

const ProcessrNodeError: FC<ErrorProps> = ({ selected, data }) => {
  return (
    <div className={`processr-node processr-node-error ${selected ? 'selected' : ''}`}>
      <div className="processr-node-label">Unknown node</div>
      <div className="processr-node-error-detail">Missing from Atlas: <code>{data.templateId}</code></div>
    </div>
  );
};

export default ProcessrNodeError;