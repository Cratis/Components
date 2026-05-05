// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Children, ReactElement, ReactNode, isValidElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { ToolbarContextProps } from './ToolbarContext';
import { useToolbarSlot } from './ToolbarSlot';

/** Width/height transition duration used by the section resize animation (ms). */
const SECTION_TRANSITION_MS = 350;

/**
 * Renders the children of a single {@link ToolbarContext} together with any slot items
 * that have been registered under the context's `slotName`.
 *
 * Extracted into its own component so that the `useToolbarSlot` hook can be called
 * inside it — hooks cannot be called inside a callback or loop in the parent.
 */
const ContextRenderer = ({ children, slotName }: { children: ReactNode; slotName?: string }) => {
    const slotItems = useToolbarSlot(slotName ?? '');
    return (
        <>
            {children}
            {slotName && slotItems.length > 0 && slotItems}
        </>
    );
};

/** Props for the {@link ToolbarSection} component. */
export interface ToolbarSectionProps {
    /**
     * The name of the currently active context.
     * Change this to trigger the fade-out / morph / fade-in animation.
     * Defaults to the first context if not specified.
     */
    activeContext?: string;

    /** {@link ToolbarContext} elements that define each context's toolbar items. */
    children: ReactNode;

    /** Layout direction matching the parent {@link Toolbar} (default: 'vertical'). */
    orientation?: 'vertical' | 'horizontal';
}

/**
 * A section within a {@link Toolbar} that supports multiple named contexts.
 *
 * When {@link activeContext} changes:
 * - The current items fade out.
 * - The section smoothly morphs to the dimensions required by the new context.
 * - The new items fade in.
 *
 * Contexts are defined by placing {@link ToolbarContext} children inside this section.
 * Switching contexts only affects this section; other sections are unaffected.
 */
export const ToolbarSection = ({ activeContext, children, orientation = 'vertical' }: ToolbarSectionProps) => {
    const contextRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const mutationObserverRef = useRef<MutationObserver | null>(null);
    const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previousContextRef = useRef<string | null>(null);
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const contexts = Children.toArray(children).filter(
        (child): child is ReactElement<ToolbarContextProps> =>
            isValidElement(child) && typeof (child.props as ToolbarContextProps).name === 'string'
    );

    // Default to the first context if activeContext is not provided
    const effectiveContext = activeContext ?? (contexts[0]?.props as ToolbarContextProps)?.name ?? '';

    const flexClass = orientation === 'horizontal' ? 'flex-row' : 'flex-col';

    /** Measure the given context's natural dimensions and update the section size. */
    const measureAndSetSize = useCallback((contextName: string) => {
        const ref = contextRefs.current[contextName];
        if (ref) {
            setSize({
                width: ref.offsetWidth,
                height: ref.offsetHeight,
            });
        }
    }, []);

    // Set the initial size synchronously before the first browser paint so there is no layout flash.
    // Empty dependency array is intentional: ongoing context changes are handled by the useEffect below.
    useLayoutEffect(() => {
        measureAndSetSize(effectiveContext);
    }, []); // run only on mount

    // Clip content only while the section is morphing between contexts so incoming
    // buttons do not float outside the current bounds during growth.
    useEffect(() => {
        if (previousContextRef.current === null) {
            previousContextRef.current = effectiveContext;
            return;
        }
        if (previousContextRef.current === effectiveContext) return;

        previousContextRef.current = effectiveContext;
        setIsTransitioning(true);

        if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = setTimeout(() => {
            setIsTransitioning(false);
            transitionTimeoutRef.current = null;
        }, SECTION_TRANSITION_MS);
    }, [effectiveContext]);

    // After a context switch, let the browser paint the opacity transition first,
    // then update the explicit size so the CSS width/height transition kicks in.
    useEffect(() => {
        measureAndSetSize(effectiveContext);
    }, [effectiveContext, measureAndSetSize]);

    // Keep section dimensions in sync when the active context's content changes size after render.
    useEffect(() => {
        const activeContextElement = contextRefs.current[effectiveContext];
        if (!activeContextElement || typeof ResizeObserver === 'undefined') {
            return;
        }

        measureAndSetSize(effectiveContext);

        mutationObserverRef.current?.disconnect();
        resizeObserverRef.current?.disconnect();

        const observer = new ResizeObserver(() => {
            measureAndSetSize(effectiveContext);
        });

        observer.observe(activeContextElement);
        resizeObserverRef.current = observer;

        if (typeof MutationObserver !== 'undefined') {
            const mutationObserver = new MutationObserver(() => {
                measureAndSetSize(effectiveContext);
            });
            mutationObserver.observe(activeContextElement, {
                childList: true,
                subtree: true,
                attributes: true,
            });
            mutationObserverRef.current = mutationObserver;
        }

        return () => {
            observer.disconnect();
            if (resizeObserverRef.current === observer) {
                resizeObserverRef.current = null;
            }

            mutationObserverRef.current?.disconnect();
            mutationObserverRef.current = null;
        };
    }, [effectiveContext, measureAndSetSize]);

    useEffect(() => () => {
        if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    }, []);

    return (
        <div
            className={`toolbar-section ${isTransitioning ? 'toolbar-section--transitioning' : ''}`}
            style={size ? { width: size.width, height: size.height } : undefined}
        >
            {contexts.map((child) => {
                const { name, children: contextChildren, slotName } = child.props as ToolbarContextProps;
                const isActive = name === effectiveContext;

                return (
                    <div
                        key={name}
                        ref={(element) => { contextRefs.current[name] = element; }}
                        className={`toolbar-context inline-flex ${flexClass} items-center gap-1 ${
                            isActive ? 'toolbar-context--active' : 'toolbar-context--inactive'
                        }`}
                    >
                        <ContextRenderer slotName={slotName}>{contextChildren}</ContextRenderer>
                    </div>
                );
            })}
        </div>
    );
};
