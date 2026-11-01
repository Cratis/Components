// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import { pickerZIndex } from './pickerStacking';

/** Props for {@link HighlightFrame}. */
export interface HighlightFrameProps {
    /** The element to frame. */
    element: Element | null;
    /** Text for the tooltip above (or below) the frame. */
    label?: string;
    /** Announced politely when the framed element changes. Omit for a passive, silent frame. */
    announcement?: string;
    /** Which overlay this is, rendered as `data-cratis-kind` so the two can be told apart. */
    kind: 'picker' | 'highlight';
}

const useEnvironmentContainer = () => {
    const environment = unstable_useOverlayEnvironment();
    const [container, setContainer] = useState<HTMLElement | null>(null);
    useEffect(() => {
        setContainer(environment.getContainer());
    }, [environment]);
    return container;
};

/** Re-measures when the page scrolls or resizes. */
const useRemeasure = (active: boolean) => {
    const [, setTick] = useState(0);
    useEffect(() => {
        if (!active) return;
        const update = () => setTick((tick) => tick + 1);
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [active]);
};

/** The shared outline and name tooltip drawn by {@link ComponentPicker} and {@link ComponentHighlight}. */
export const HighlightFrame = ({ element, label, announcement, kind }: HighlightFrameProps) => {
    const container = useEnvironmentContainer();
    useRemeasure(element !== null);
    if (!container) return null;

    const rect = element?.getBoundingClientRect();
    const zIndex = pickerZIndex();
    const labelAbove = rect ? rect.top > 28 : true;

    return createPortal(
        <div
            data-cratis-part='overlay'
            data-cratis-kind={kind}
            data-live-announcer='true'
            data-react-aria-top-layer='true'
            data-cratis-picker-ignore='true'
            style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex }}
        >
            {announcement !== undefined && (
                <div
                    role='status'
                    aria-live='polite'
                    style={{
                        position: 'absolute',
                        width: 1,
                        height: 1,
                        overflow: 'hidden',
                        clipPath: 'inset(50%)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {announcement}
                </div>
            )}
            {rect && (
                <div
                    data-cratis-part='frame'
                    aria-hidden='true'
                    style={{
                        position: 'fixed',
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                        boxSizing: 'border-box',
                        outline: '2px solid var(--cratis-focus-ring-color, Highlight)',
                        outlineOffset: 1,
                        background: 'color-mix(in srgb, var(--cratis-focus-ring-color, Highlight) 12%, transparent)',
                        borderRadius: 'var(--cratis-border-radius, 4px)',
                    }}
                >
                    {label && (
                        <span
                            data-cratis-part='name'
                            style={{
                                position: 'absolute',
                                left: 0,
                                [labelAbove ? 'bottom' : 'top']: '100%',
                                marginBlock: 4,
                                padding: '2px 6px',
                                whiteSpace: 'nowrap',
                                font: '600 12px/1.4 system-ui, sans-serif',
                                color: 'var(--cratis-surface-background, Canvas)',
                                background: 'var(--cratis-text-color, CanvasText)',
                                borderRadius: 'var(--cratis-border-radius, 4px)',
                            }}
                        >
                            {label}
                        </span>
                    )}
                </div>
            )}
        </div>,
        container,
    );
};
