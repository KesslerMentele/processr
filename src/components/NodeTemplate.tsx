import type { NodeTemplate } from "../models";
import { type FC, type RefObject, useCallback, useRef, useState } from "react";
import { useDraggable } from "@neodrag/react";
import { createProcessrNode } from "../utils/graph-factory.ts";
import { useProcessrStore } from "../state/store.ts";
import { useReactFlow, type XYPosition } from "@xyflow/react";



export const DraggableNodeTemplate: FC<{template:NodeTemplate}> = ({ template }) => {
  const draggableRef = useRef<HTMLDivElement>(null);
  const addNode = useProcessrStore.use.addNode();
  const { screenToFlowPosition } = useReactFlow();

  const handleNodeDrop = useCallback(
    (screenPosition: XYPosition) => {
      const flow = document.querySelector('.react-flow');
      const flowRect = flow?.getBoundingClientRect();
      const isInFlow =
        flowRect &&
        screenPosition.x >= flowRect.left &&
        screenPosition.x <= flowRect.right &&
        screenPosition.y >= flowRect.top &&
        screenPosition.y <= flowRect.bottom;

      // Create a new node and add it to the flow
      if (isInFlow) {
        const position = screenToFlowPosition(screenPosition);
        addNode(createProcessrNode(template, position));
      }
    }, [addNode, screenToFlowPosition, template],
  );

  const [position, setPosition] = useState({ x: 0, y: 0 });

  useDraggable(draggableRef as RefObject<HTMLElement>, {
    position,
    onDragStart: ({ rootNode }) => {
      rootNode.closest('.sidebar')?.classList.add('sidebar__dragging');
    },
    onDrag: ({ offsetX, offsetY }) => {
      setPosition({ x: offsetX, y: offsetY });
    },
    onDragEnd: ({ rootNode, event }) => {
      setPosition({ x: 0, y: 0 });
      rootNode.closest('.sidebar')?.classList.remove('sidebar__dragging');
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (target?.closest('.canvas-container')) {
        handleNodeDrop({ x: event.clientX, y: event.clientY });
      }
    }
  });
  

  return <div ref={draggableRef} className="node-template">{template.name}</div>;
};

