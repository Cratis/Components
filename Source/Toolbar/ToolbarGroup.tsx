// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useToolbarSlot } from './ToolbarSlot';

/** How long the fade-out animation runs (ms). React unmounts exiting content after this. */
const SLOT_TRANSITION_MS = 220;

/**
 * Renders slot items with a cross-fade and size-morph transition that mirrors the
 * {@link ToolbarSection} / {@link ToolbarContext} animation:
 *
 * - The slot container resizes smoothly to fit the incoming content.
 * - The outgoing content fades out while the incoming content fades in simultaneously.
 *
 * The size update is intentionally deferred to {@link useEffect} (after paint) so that
 * the opacity animations start one frame before the resize — matching the feel of
 * {@link ToolbarSection} context switching.
 */
const SlotTransition = ({ slotName, flexClass }: { slotName: string; flexClass: string }) => {
    const liveItems = useToolbarSlot(slotName);

    // `current` is the content fading in (or already settled at full opacity).
    // `exiting` is the previous content fading out, kept alive until its animation completes.
    const [current, setCurrent] = useState<ReactNode[]>(liveItems);
    const [exiting, setExiting] = useState<ReactNode[]>([]);
    const [exitRevision, setExitRevision] = useState(0);

    // Track `current` in a ref so the liveItems effect can read the latest value
    // without needing it in its dependency array (avoids an unnecessary re-run loop).
    const currentRef = useRef<ReactNode[]>(current);
    currentRef.current = current;

    const incomingRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const hasMountedRef = useRef(false);

    const measureIncoming = useCallback(() => {
        if (incomingRef.current) {
            setSize({
                width: incomingRef.current.offsetWidth,
                height: incomingRef.current.offsetHeight,
            });
        }
    }, []);

    // Set the initial size synchronously before the first paint — no layout flash.
    useLayoutEffect(() => {
        measureIncoming();
    }, []); // mount only

    // Detect live-items reference change → start cross-fade transition.
    useEffect(() => {
        if (liveItems === currentRef.current) return;
        const old = currentRef.current;

        if (timerRef.current !== undefined) clearTimeout(timerRef.current);
        setCurrent(liveItems);

        if (old.length > 0) {
            setExiting(old);
            setExitRevision(r => r + 1);
            timerRef.current = setTimeout(() => setExiting([]), SLOT_TRANSITION_MS);
        }
    }, [liveItems]);

    // Re-measure the incoming content whenever `current` changes so the container
    // can size-morph. useEffect (not useLayoutEffect) is intentional: we let the
    // opacity animation start one frame before the resize — matching ToolbarSection.
    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return; // initial measurement handled by useLayoutEffect above
        }
        measureIncoming();
    }, [current, measureIncoming]);

    useEffect(() => () => {
        if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    }, []);

    if (current.length === 0 && exiting.length === 0) return null;

    return (
        <div
            className='toolbar-slot-section'
            style={size ? { width: size.width, height: size.height } : undefined}
        >
            {/* Incoming content — fades in via @keyframes animation on mount */}
            <div
                ref={incomingRef}
                className={`toolbar-slot-incoming inline-flex ${flexClass} items-center gap-1`}
            >
                {current}
            </div>
            {/* Exiting content — fades out, then React unmounts it after SLOT_TRANSITION_MS */}
            {exiting.length > 0 && (
                <div
                    key={exitRevision}
                    className={`toolbar-slot-outgoing inline-flex ${flexClass} items-center gap-1`}
                >
                    {exiting}
                </div>
            )}
        </div>
    );
};

/** Props for the {@link ToolbarGroup} component. */
export interface ToolbarGroupProps {
    /** The toolbar items to render inside this group. */
    children?: ReactNode;

    /**
     * Optional slot name. When provided, any {@link ToolbarSlot} with a matching `slotName`
     * within the nearest {@link ToolbarSlotProvider} will render its content inside this group.
     *
     * Slot entries are appended after the group's own children and sorted by their `order` value.
     */
    slotName?: string;

    /** Layout direction of the group, should match the parent {@link Toolbar} (default: `'vertical'`). */
    orientation?: 'vertical' | 'horizontal';
}

/**
 * A logical sub-grouping of toolbar items within a {@link Toolbar}.
 *
 * Use `ToolbarGroup` to cluster related buttons into a visually cohesive unit.
 * Groups can participate in the slot system by providing a `slotName` — external
 * components anywhere in the {@link ToolbarSlotProvider} tree can then inject additional
 * buttons at a chosen position via {@link ToolbarSlot}.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *     <ToolbarGroup slotName="canvas-tools">
 *         <ToolbarButton icon="pi pi-pencil" title="Draw" />
 *     </ToolbarGroup>
 * </Toolbar>
 * ```
 */
export const ToolbarGroup = ({ children, slotName, orientation = 'vertical' }: ToolbarGroupProps) => {
    const flexClass = orientation === 'horizontal' ? 'flex-row' : 'flex-col';

    return (
        <div className={`toolbar-group inline-flex ${flexClass} items-center gap-1 p-2 rounded-2xl`}>
            {children}
            {slotName && <SlotTransition slotName={slotName} flexClass={flexClass} />}
        </div>
    );
};
