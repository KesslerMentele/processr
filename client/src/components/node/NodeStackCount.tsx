import { type ChangeEvent, type FC, type KeyboardEvent, useState } from "react";
import type { ProcessrNodeId } from "../../models";
import { useProcessrStore } from "../../state/store.ts";

interface NodeStackCountProps {
  id: ProcessrNodeId;
  count: number
}


const NodeStackCount: FC<NodeStackCountProps> = ({ id, count }) => {
  const [modifyCount, setModifyCount] = useState(false);
  const [newCount, setNewCount] = useState(count);
  const setStackSize = useProcessrStore.use.setNodeStackSize();

  const handleClickCount = () => {
    setModifyCount(true);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewCount(Number(e.target.value.replace(/\D+/gi, '')));
  };

  const handleSubmit = () => {
    setStackSize(id, newCount);
    setModifyCount(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
     <span className="processr-node-count-badge" onClick={handleClickCount}>
       ×{ modifyCount
       ? <input
           className="nodrag"
           type="text"
           inputMode="numeric"
           maxLength={3}
           value={newCount}
           autoFocus
           onChange={handleChange}
           onBlur={handleSubmit}
           onKeyDown={handleKeyDown}
         />
       : count }
     </span>
  );
};

export default NodeStackCount;

