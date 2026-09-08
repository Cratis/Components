// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    Children,
    type HTMLAttributes,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useToolbarSlot } from './ToolbarSlot';
import { ToolbarItemVisibilityProvider } from './ToolbarItemVisibilityContext';

/** How long the fade-out animation runs (ms). React unmounts exiting content after this. */
const LAYOUT_TRANSITION_MS = 220;

/**
 * Renders toolbar layout content with a cross-fade and size-morph transition.
 *
 * - The container resizes smoothly to fit incoming layout content.
 * - Outgoing content fades out while incoming content fades in.
 */
const LayoutTransition = ({
    items,
    flexClass,
    pt,
}: {
    items: ReactNode[];
    flexClass: string;
    pt?: ToolbarLayoutParts;
}) => {
    const [current, setCurrent] = useState<ReactNode[]>(items);
    const [exiting, setExiting] = useState<ReactNode[]>([]);
    const [exitRevision, setExitRevision] = useState(0);

    const currentRef = useRef<ReactNode[]>(current);
    currentRef.current = current;

    const incomingRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // ResizeObserver keeps the container size in sync with the actual rendered
    // content, including when nested ToolbarLayouts finish their own transitions.
    // A one-shot offsetHeight read in useEffect misses those deferred size changes.
    useEffect(() => {
        const el = incomingRef.current;
        if (!el) return;

        const sync = () => setSize({ width: el.offsetWidth, height: el.offsetHeight });

        const observer = new ResizeObserver(sync);
        observer.observe(el);
        sync(); // capture initial size immediately

        return () => observer.disconnect();
    }, []); // mount only — observer tracks all subsequent changes automatically

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

    useEffect(() => () => {
        if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    }, []);

    if (current.length === 0 && exiting.length === 0) return null;

    // The section is only clipped while outgoing content is fading out, so it
    // doesn't bleed outside the container. Once the transition is complete the
    // section must be overflow:visible so fan-out and folder panels (which are
    // position:absolute children) can escape the slot section's bounds.
    const transitioningClass = exiting.length > 0 ? 'toolbar-slot-section--transitioning' : '';

    return (
        <div
            {...pt?.slot}
            className={`toolbar-slot-section ${transitioningClass} ${pt?.slot?.className ?? ''}`}
            style={{ ...pt?.slot?.style, ...(size ? { width: size.width, height: size.height } : {}) }}
            data-cratis-part='toolbar-slot'
            data-transitioning={exiting.length > 0 || undefined}
        >
            <div
                {...pt?.incoming}
                ref={incomingRef}
                className={`toolbar-slot-incoming cratis:inline-flex ${flexClass} cratis:items-center cratis:gap-1 ${pt?.incoming?.className ?? ''}`}
                data-cratis-part='toolbar-slot-incoming'
            >
                {current}
            </div>
            {exiting.length > 0 && (
                <div
                    key={exitRevision}
                    {...pt?.outgoing}
                    className={`toolbar-slot-outgoing cratis:inline-flex ${flexClass} cratis:items-center cratis:gap-1 ${pt?.outgoing?.className ?? ''}`}
                    data-cratis-part='toolbar-slot-outgoing'
                    aria-hidden='true'
                    inert
                >
                    <ToolbarItemVisibilityProvider value={false}>
                        {exiting}
                    </ToolbarItemVisibilityProvider>
                </div>
            )}
        </div>
    );
};

/** Stable part attributes for {@link ToolbarLayout}. */
export interface ToolbarLayoutParts {
    /** Named layout root. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Slot-transition measurement boundary. */
    slot?: HTMLAttributes<HTMLDivElement>;
    /** Current layout content. */
    incoming?: HTMLAttributes<HTMLDivElement>;
    /** Previous layout content while it exits. */
    outgoing?: HTMLAttributes<HTMLDivElement>;
}

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

    /** Stable layout and transition attributes. */
    pt?: ToolbarLayoutParts;
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
 *         <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title="Select" />
 *         <ToolbarLayout name="canvas-tools">
 *             <ToolbarGroup>
 *                 <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title="Draw (default)" />
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
 *             <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title="Feature tool" />
 *         </ToolbarGroup>
 *         <ToolbarSeparator />
 *         <ToolbarGroup>
 *             <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title="Quick action" />
 *         </ToolbarGroup>
 *     </ToolbarSlot>
 * );
 * ```
 */
export const ToolbarLayout = ({
    name,
    children,
    orientation = 'vertical',
    pt,
}: ToolbarLayoutProps) => {
    const slotItems = useToolbarSlot(name);
    const flexClass = orientation === 'horizontal' ? 'cratis:flex-row' : 'cratis:flex-col';
    const fallbackItems = useMemo(() => Children.toArray(children), [children]);
    const items = slotItems.length > 0 ? slotItems : fallbackItems;

    if (items.length === 0) return null;

    return (
        <div
            {...pt?.root}
            className={`toolbar-layout cratis:inline-flex ${flexClass} cratis:items-center cratis:gap-1 ${pt?.root?.className ?? ''}`}
            data-cratis-part='toolbar-layout'
            data-layout-name={name}
            data-orientation={orientation}
        >
            <LayoutTransition items={items} flexClass={flexClass} pt={pt} />
        </div>
    );
};
