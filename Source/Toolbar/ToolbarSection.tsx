// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Children, ReactElement, ReactNode, isValidElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import './Toolbar.css';
import type { ToolbarContextProps } from './ToolbarContext';

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
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);

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
            setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
        }
    }, []);

    // Set the initial size synchronously before the first browser paint so there is no layout flash.
    // Empty dependency array is intentional: ongoing context changes are handled by the useEffect below.
    useLayoutEffect(() => {
        measureAndSetSize(effectiveContext);
    }, []); // run only on mount

    // After a context switch, let the browser paint the opacity transition first,
    // then update the explicit size so the CSS width/height transition kicks in.
    useEffect(() => {
        measureAndSetSize(effectiveContext);
    }, [effectiveContext, measureAndSetSize]);

    return (
        <div
            className='toolbar-section'
            style={size ? { width: size.width, height: size.height } : undefined}
        >
            {contexts.map((child) => {
                const { name, children: contextChildren } = child.props as ToolbarContextProps;
                const isActive = name === effectiveContext;

                return (
                    <div
                        key={name}
                        ref={(element) => { contextRefs.current[name] = element; }}
                        className={`toolbar-context inline-flex ${flexClass} items-center gap-1 ${
                            isActive ? 'toolbar-context--active' : 'toolbar-context--inactive'
                        }`}
                    >
                        {contextChildren}
                    </div>
                );
            })}
        </div>
    );
};
