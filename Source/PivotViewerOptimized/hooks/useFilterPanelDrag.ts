import { useState, useCallback, useEffect } from 'react';

export function useFilterPanelDrag() {
  const [filterPanelPos, setFilterPanelPos] = useState({ x: 16, y: 88 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleFilterPanelDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingPanel(true);
    setDragOffset({
      x: e.clientX - filterPanelPos.x,
      y: e.clientY - filterPanelPos.y,
    });
  }, [filterPanelPos]);

  const handleFilterPanelDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingPanel) return;
    setFilterPanelPos({
      x: Math.max(0, e.clientX - dragOffset.x),
      y: Math.max(60, e.clientY - dragOffset.y),
    });
  }, [isDraggingPanel, dragOffset]);

  const handleFilterPanelDragEnd = useCallback(() => {
    setIsDraggingPanel(false);
  }, []);

  useEffect(() => {
    if (isDraggingPanel) {
      document.addEventListener('mousemove', handleFilterPanelDrag);
      document.addEventListener('mouseup', handleFilterPanelDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleFilterPanelDrag);
        document.removeEventListener('mouseup', handleFilterPanelDragEnd);
      };
    }
  }, [isDraggingPanel, handleFilterPanelDrag, handleFilterPanelDragEnd]);

  return {
    filterPanelPos,
    isDraggingPanel,
    handleFilterPanelDragStart,
  };
}
