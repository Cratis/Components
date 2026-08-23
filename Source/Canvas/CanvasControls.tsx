// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useEffect, useState } from 'react';
import { CONTENT_ATTR } from './glassAttributes';
import { CanvasMinimap, CanvasMinimapHandle, MinimapItem } from './CanvasMinimap';

// How often the zoom-percentage label re-reads the live zoom. The canvas must not re-render during
// gestures, so the label polls the ref-backed value on a slow interval instead of receiving state.
const ZOOM_READOUT_POLL_MS = 200;

/** Overrides for the controls' button labels/tooltips. Any field left unset falls back to a literal
 *  English default - this library ships no i18n mechanism of its own, so a consumer that localizes
 *  passes its own translated strings through here. */
export interface CanvasControlsLabels {
    /** Tooltip for the minimap toggle button. */
    toggleMinimap?: string;
    /** Tooltip for the zoom-out button. */
    zoomOut?: string;
    /** Tooltip for the zoom-percentage button that resets zoom to 100%. */
    resetZoom?: string;
    /** Tooltip for the zoom-in button. */
    zoomIn?: string;
    /** Fallback tooltip for the help button, used when `helpTitle` is not supplied. */
    help?: string;
}

export interface CanvasControlsProps {
    /** Reads the live zoom factor — polled slowly so gestures never re-render the canvas. */
    getZoom: () => number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;

    showMinimapToggle?: boolean;

    minimapRef?: React.RefObject<CanvasMinimapHandle | null>;
    minimapWorldWidth?: number;
    minimapWorldHeight?: number;

    minimapItems?: MinimapItem[];
    onMinimapPan?: (pan: { x: number; y: number }) => void;

    placement?: 'bottom-left' | 'bottom-right';

    /** Invoked when the help button is clicked. When omitted, the help button is not rendered. */
    onHelp?: () => void;
    /** Tooltip for the help button. Falls back to `labels.help` and then a literal default. */
    helpTitle?: string;

    /** Overrides for the controls' button labels/tooltips. Unset fields fall back to literal English
     *  defaults. */
    labels?: CanvasControlsLabels;

    /**
     * Renders a glass/acrylic surface behind the control bar, in the same spot a consumer's own
     * `<LiquidGlassSurface cornerRadius={999} />` (from `@cratis/liquid-glass`, a Studio-only package
     * this library cannot depend on) used to occupy. When omitted, nothing is rendered there and the
     * CSS-only `.canvas-controls-glass` / `.canvas-controls-glass--plain` styling still applies -
     * a plain, GPU-composited backdrop-filter pill. Ignored when `disableGlass` is set.
     */
    glassSurface?: React.ReactNode;

    /**
     * Disables the glass surface behind the control bar, falling back to a CSS backdrop-filter pill:
     * `glassSurface` is not rendered, and the `CONTENT_ATTR` marker is not set. A full-scene glass
     * capture (like LiquidGlass's) re-rasterizes the content behind it on every interaction frame; on a
     * very large canvas that costs hundreds of ms and stalls pan/zoom, so large boards opt out.
     */
    disableGlass?: boolean;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
    getZoom,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    showMinimapToggle = false,
    minimapRef,
    minimapWorldWidth,
    minimapWorldHeight,
    minimapItems,
    onMinimapPan,
    placement = 'bottom-left',
    onHelp,
    helpTitle,
    labels,
    glassSurface,
    disableGlass = false,
}) => {
    const [minimapOpen, setMinimapOpen] = useState(false);
    const [displayZoom, setDisplayZoom] = useState(getZoom);
    const alignClass = placement === 'bottom-right' ? 'items-end' : 'items-start';

    // The controls step aside for whatever the canvas viewport is inset by at their own edge — the docked
    // right panel for the bottom-right placement, the project drawer for the bottom-left one — exactly like
    // the top toolbars do. See Components/Viewport.
    const alignStyle: React.CSSProperties = placement === 'bottom-right'
        ? { right: 'calc(1rem + var(--canvas-viewport-right, 0px))', transition: 'right 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }
        : { left: 'calc(1rem + var(--canvas-viewport-left, 0px))', transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)' };

    // Poll the live zoom for the readout — only this small component re-renders, never the canvas.
    useEffect(() => {
        const timer = setInterval(() => {
            setDisplayZoom(previous => {
                const current = getZoom();
                return current === previous ? previous : current;
            });
        }, ZOOM_READOUT_POLL_MS);
        return () => clearInterval(timer);
    }, [getZoom]);

    const refreshDisplayZoom = () => setDisplayZoom(getZoom());

    return (
        <div
            className={`absolute bottom-4 ${alignClass} z-10 flex flex-col gap-2`}
            style={alignStyle}
            onPointerDown={e => e.stopPropagation()}
        >
            {/* Minimap panel — pops up above the bar */}
            {showMinimapToggle && minimapOpen && (
                <CanvasMinimap
                    ref={minimapRef}
                    worldWidth={minimapWorldWidth}
                    worldHeight={minimapWorldHeight}
                    items={minimapItems}
                    onRequestPan={onMinimapPan}
                />
            )}

            {/* Control bar - on a glass surface like every other toolbar (a cheap backdrop-filter pill on
                large boards, where a full-scene glass capture would stall interaction). The content marker
                is only set when the glass surface exists: with the plain pill nothing refracts this
                subtree, and the marker would make every zoom-label update trigger a whole-page
                content-layer capture. */}
            <div className={`canvas-controls-glass${disableGlass ? ' canvas-controls-glass--plain' : ''}`} {...(disableGlass ? {} : { [CONTENT_ATTR]: 'true' })}>
                {!disableGlass && glassSurface}
            <div className='canvas-controls-bar inline-flex flex-row items-center gap-1 px-2 py-1.5 rounded-2xl'>
                {showMinimapToggle && (
                    <>
                        <button
                            title={labels?.toggleMinimap ?? 'Toggle minimap'}
                            className={`canvas-controls-icon-btn flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer select-none${minimapOpen ? ' canvas-controls-icon-btn--active' : ''}`}
                            onClick={() => setMinimapOpen(v => !v)}
                        >
                            <i className='pi pi-th-large text-base' />
                        </button>
                        <span className='canvas-controls-separator' />
                    </>
                )}

                {/* Zoom controls */}
                <button title={labels?.zoomOut ?? 'Zoom Out'} className='canvas-controls-icon-btn flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer select-none' onClick={() => { onZoomOut(); refreshDisplayZoom(); }}>
                    <i className='pi pi-minus text-base' />
                </button>
                <button
                    title={labels?.resetZoom ?? 'Reset Zoom'}
                    onClick={() => { onZoomReset(); refreshDisplayZoom(); }}
                    className='canvas-controls-zoom-btn flex items-center justify-center h-9 min-w-[3.25rem] px-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none tabular-nums'
                >
                    {Math.round(displayZoom * 100)}%
                </button>
                <button title={labels?.zoomIn ?? 'Zoom In'} className='canvas-controls-icon-btn flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer select-none' onClick={() => { onZoomIn(); refreshDisplayZoom(); }}>
                    <i className='pi pi-plus text-base' />
                </button>

                {/* Help - only where there is something to explain; a button that does nothing is worse than none. */}
                {onHelp && (
                    <>
                        <span className='canvas-controls-separator' />
                        <button
                            title={helpTitle ?? labels?.help ?? 'Help'}
                            className='canvas-controls-icon-btn flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer select-none'
                            onClick={onHelp}
                        >
                            <i className='pi pi-question-circle text-base' />
                        </button>
                    </>
                )}
            </div>
            </div>
        </div>
    );
};
