// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Children, ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useToolbarSlot } from './ToolbarSlot';

/** How long the fade-out animation runs (ms). React unmounts exiting content after this. */
const LAYOUT_TRANSITION_MS = 220;

/**
 * Renders toolbar layout content with a cross-fade and size-morph transition.
 *
 * - The container resizes smoothly to fit incoming layout content.
 * - Outgoing content fades out while incoming content fades in.
 */
const LayoutTransition = ({ items, flexClass }: { items: ReactNode[]; flexClass: string }) => {
    const [current, setCurrent] = useState<ReactNode[]>(items);
    const [exiting, setExiting] = useState<ReactNode[]>([]);
    const [exitRevision, setExitRevision] = useState(0);

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

    useLayoutEffect(() => {
        measureIncoming();
    }, []); // mount only

    useEffect(() => {
        if (items === currentRef.current) return;
        const old = currentRef.current;

        if (timerRef.current !== undefined) clearTimeout(timerRef.current);
        setCurrent(items);

        if (old.length > 0) {
            setExiting(old);
            setExitRevision(revision => revision + 1);
            timerRef.current = setTimeout(() => setExiting([]), LAYOUT_TRANSITION_MS);
        }
    }, [items]);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
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
            <div
                ref={incomingRef}
                className={`toolbar-slot-incoming inline-flex ${flexClass} items-center gap-1`}
            >
                {current}
            </div>
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

/** Props for the {@link ToolbarLayout} component. */
export interface ToolbarLayoutProps {
    /**
     * The name identifying this layout region.
     * External components use this as the `slotName` on a {@link ToolbarSlot} to inject content.
     */
    name: string;

    /**
     * Default content shown when no slot content has been registered for this layout.
     * Can include {@link ToolbarGroup}, {@link ToolbarSection}, {@link ToolbarSeparator},
     * or any other toolbar elements.
     */
    children?: ReactNode;

    /** Layout direction matching the parent {@link Toolbar} (default: `'vertical'`). */
    orientation?: 'vertical' | 'horizontal';
}

/**
 * A named, transparent layout region inside a {@link Toolbar} that enables decoupled,
 * dynamically swappable toolbar content.
 *
 * Unlike {@link ToolbarGroup}, `ToolbarLayout` has no visual container of its own.
 * It acts as a transparent mount point: external components inject complete toolbar
 * structures — multiple {@link ToolbarGroup}s, {@link ToolbarSection}s,
 * {@link ToolbarSeparator}s — using a {@link ToolbarSlot} with a matching `slotName`.
 *
 * When any slot content is registered it replaces the fallback `children`. Multiple
 * independent contributors can register into the same layout using different `order`
 * values on their {@link ToolbarSlot}.
 *
 * Wrap the toolbar and contributing components in a {@link ToolbarSlotProvider}:
 *
 * @example
 * ```tsx
 * // Application shell — define the layout region with optional fallback content:
 * <ToolbarSlotProvider>
 *     <Toolbar>
 *         <ToolbarButton icon="pi pi-arrow-up-left" title="Select" />
 *         <ToolbarLayout name="canvas-tools">
 *             <ToolbarGroup>
 *                 <ToolbarButton icon="pi pi-pencil" title="Draw (default)" />
 *             </ToolbarGroup>
 *         </ToolbarLayout>
 *     </Toolbar>
 *
 *     <CanvasFeature />
 * </ToolbarSlotProvider>
 *
 * // Feature component — inject complete groups:
 * const CanvasFeature = () => (
 *     <ToolbarSlot slotName="canvas-tools">
 *         <ToolbarGroup>
 *             <ToolbarButton icon="pi pi-star" title="Feature tool" />
 *         </ToolbarGroup>
 *         <ToolbarSeparator />
 *         <ToolbarGroup>
 *             <ToolbarButton icon="pi pi-bolt" title="Quick action" />
 *         </ToolbarGroup>
 *     </ToolbarSlot>
 * );
 * ```
 */
export const ToolbarLayout = ({ name, children, orientation = 'vertical' }: ToolbarLayoutProps) => {
    const slotItems = useToolbarSlot(name);
    const flexClass = orientation === 'horizontal' ? 'flex-row' : 'flex-col';
    const fallbackItems = useMemo(() => Children.toArray(children), [children]);
    const items = slotItems.length > 0 ? slotItems : fallbackItems;

    if (items.length === 0) return null;

    return (
        <div className={`toolbar-layout inline-flex ${flexClass} items-center gap-1`}>
            <LayoutTransition items={items} flexClass={flexClass} />
        </div>
    );
};
