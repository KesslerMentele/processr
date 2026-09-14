import { useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

interface Position { x: number; y: number }

export const useDraggable = (setPosition: (pos: Readonly<Position>) => void) => {
  const posRef = useRef({ x: 0, y: 0 });

  const onMouseDown = (e: Readonly<ReactMouseEvent>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const startX = e.clientX - posRef.current.x;
    const startY = e.clientY - posRef.current.y;

    const onMove = (ev: Readonly<globalThis.MouseEvent>) => {
      const newPos = { x: ev.clientX - startX, y: ev.clientY - startY };
      // eslint-disable-next-line functional/immutable-data
      posRef.current = newPos;
      setPosition(newPos);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return { onMouseDown };
};
