// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { useContext, useEffect, useId, useRef, useState } from 'react';
import { CanvasItemRegistryContext } from './Canvas';

/** Props for a measured DOM item positioned in Canvas world space. */
export interface CanvasItemProps {
    /**
     * Registers this item in the Canvas item registry under a caller-chosen key instead of an
     * internally generated one. Opting in makes the item's world-space bounds addressable — a
     * `Region` on the same board can then recognize the item and report region membership for it
     * over the Arc messenger, keyed by exactly this id. Omit for the same behavior as before the
     * prop existed: the item still feeds the minimap and fit-to-content, but is anonymous to
     * everything that matches items by id.
     */
    id?: string;

    /** World-space horizontal position. */
    x: number;
    /** World-space vertical position. */
    y: number;

    /**
     * Where this item stacks against its sibling canvas items. `CanvasItem` renders with a
     * `transform`, which establishes its own stacking context — a z-index set on something nested
     * inside one item can never win against a *different* item, only against its own siblings, so
     * elevating one item above another has to happen here, on the item root itself. Omit for the
     * default stacking order (DOM order, same as every other item).
     */
    zIndex?: number;

    /** Reports measured size changes. */
    onSize?: (width: number, height: number) => void;
    /** Item content. */
    children: React.ReactNode;
}

/**
 * A measured DOM element positioned in Canvas world space, registered so the Canvas minimap can
 * show it. Observes size changes and reports bounds to the nearest Canvas registry.
 */
export const CanvasItem: React.FC<CanvasItemProps> = ({
    id,
    x,
    y,
    zIndex,
    onSize,
    children,
}) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const onSizeRef = useRef(onSize);
    const registryContext = useContext(CanvasItemRegistryContext);
    // The registry key: the caller's id when given, otherwise a generated one — useId is called
    // unconditionally (rules of hooks), the generated value simply goes unused when overridden.
    // Should `id` change between renders, the effects below unregister the old key and register
    // the new one, so the registry never holds both.
    const generatedId = useId();
    const itemId = id ?? generatedId;
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);

    onSizeRef.current = onSize;

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                onSizeRef.current?.(width, height);
                setSize({ width, height });
            }
        });
        observer.observe(element);

        // Fire initial measurement
        const { width, height } = element.getBoundingClientRect();
        onSizeRef.current?.(width, height);
        setSize({ width, height });

        return () => observer.disconnect();
    }, [itemId]);

    // Register with the Canvas registry whenever position or size changes
    useEffect(() => {
        if (!size || !registryContext) return;
        registryContext.register(itemId, {
            x,
            y,
            width: size.width,
            height: size.height,
        });
    }, [x, y, size, registryContext, itemId]);

    // Unregister when unmounting
    useEffect(() => {
        return () => {
            registryContext?.unregister(itemId);
        };
    }, [registryContext, itemId]);

    return (
        <div
            ref={elementRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translate(${x}px, ${y}px)`,
                pointerEvents: 'auto',
                zIndex,
            }}
        >
            {children}
        </div>
    );
};
