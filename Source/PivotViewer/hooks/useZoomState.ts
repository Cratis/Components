// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState, useCallback } from 'react';
import { ZOOM_MIN, ZOOM_MAX } from '../utils/utils';

export function useZoomState(initialZoom = 1) {
  const [zoomLevel, setZoomLevel] = useState(initialZoom);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoomLevel(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom)));
  }, []);

  const handleZoomIn = useCallback(() => {
    handleZoomChange(zoomLevel + 0.2);
  }, [zoomLevel, handleZoomChange]);

  const handleZoomOut = useCallback(() => {
    handleZoomChange(zoomLevel - 0.2);
  }, [zoomLevel, handleZoomChange]);

  const handleZoomSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleZoomChange(parseFloat(e.target.value));
  }, [handleZoomChange]);

  return {
    zoomLevel,
    setZoomLevel,
    handleZoomChange,
    handleZoomIn,
    handleZoomOut,
    handleZoomSlider,
  };
}
