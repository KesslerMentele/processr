import type { NodeTemplate } from "../models";
import { type FC, type RefObject, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDraggable } from "@neodrag/react";
import { createProcessrNode } from "../utils/graph-factory.ts";
import { useProcessrStore } from "../state/store.ts";
import { useReactFlow, type XYPosition } from "@xyflow/react";


export const DraggableNodeTemplate: FC<{template:NodeTemplate}> = ({ template }) => {
  const draggableRef = useRef<HTMLDivElement>(null);
  const addNode = useProcessrStore.use.addNode();
  const setSelectedNodeId = useProcessrStore.use.setSelectedNodeId();
  const packIndex = useProcessrStore.use.packIndex();
  const { screenToFlowPosition } = useReactFlow();

  const startRectRef = useRef<DOMRect | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

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

      if (isInFlow) {
        const position = screenToFlowPosition(screenPosition);
        const compatibleRecipes = packIndex.recipesByNodeType.get(template.id) ?? [];
        const autoRecipeId = compatibleRecipes.length === 1 ? compatibleRecipes[0].id : null;
        const node = createProcessrNode(template, position, autoRecipeId ? { recipeId: autoRecipeId } : undefined);
        addNode(node);
        setSelectedNodeId(node.id);
      }
    }, [addNode, packIndex.recipesByNodeType, screenToFlowPosition, setSelectedNodeId, template],
  );

  useDraggable(draggableRef as RefObject<HTMLElement>, {
    position,
    onDragStart: ({ rootNode }) => {
      // eslint-disable-next-line functional/immutable-data
      startRectRef.current = rootNode.getBoundingClientRect();
      setGhostPos({ x: startRectRef.current.left, y: startRectRef.current.top });
    },
    onDrag: ({ offsetX, offsetY }) => {
      setPosition({ x: offsetX, y: offsetY });
      if (startRectRef.current) {
        setGhostPos({ x: startRectRef.current.left + offsetX, y: startRectRef.current.top + offsetY });
      }
    },
    onDragEnd: ({ event }) => {
      setPosition({ x: 0, y: 0 });
      setGhostPos(null);
      // eslint-disable-next-line functional/immutable-data
      startRectRef.current = null;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (target?.closest('.canvas-container')) {
        handleNodeDrop({ x: event.clientX, y: event.clientY });
      }
    }
  });

  return (
    <>
      <div ref={draggableRef} className="node-template" style={{ opacity: ghostPos ? 0 : 1 }}>
        {template.name}
      </div>
      {ghostPos && startRectRef.current && createPortal(
        <div
          className="node-template node-template--drag-ghost"
          style={{
            position: 'fixed',
            left: ghostPos.x,
            top: ghostPos.y,
            width: startRectRef.current.width,
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.9,
          }}
        >
          {template.name}
        </div>,
        document.body
      )}
    </>
  );
};