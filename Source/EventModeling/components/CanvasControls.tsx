// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';

export interface CanvasControlsProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onFitToView: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
    zoom,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onFitToView,
}) => {
    return (
        <div className="event-modeling-controls">
            <button
                className="event-modeling-control-button"
                onClick={onZoomIn}
                title="Zoom In (+)"
            >
                +
            </button>
            <button
                className="event-modeling-control-button"
                onClick={onZoomOut}
                title="Zoom Out (-)"
            >
                −
            </button>
            <button
                className="event-modeling-control-button"
                onClick={onZoomReset}
                title="Reset Zoom (0)"
            >
                {Math.round(zoom * 100)}%
            </button>
            <button
                className="event-modeling-control-button"
                onClick={onFitToView}
                title="Fit to View (F)"
            >
                ⊡
            </button>
        </div>
    );
};
