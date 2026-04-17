import { type FC, useState } from "react";
import type { ProcessrNodeId } from "../../models";

interface NodeStackCountProps {
  id: ProcessrNodeId;
  count: number
}


const NodeStackCount: FC<NodeStackCountProps> = ({ id, count }) => {
  const [modifyCount, setModifyCount] = useState(false);

  const handleClickCount = () => {
    setModifyCount(true);
  };

  return (
    <>
    { modifyCount ? <input type="text"> Modifiable </input>
      : <span className="processr-node-count-badge" onClick={handleClickCount}>×{count}</span>
    }
    </>
  );
};

export default NodeStackCount;

