// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ReactNode } from 'react';
import { useToolbarSlot } from './ToolbarSlot';

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

    const content = slotItems.length > 0 ? slotItems : children;
    if (content == null) return null;

    return (
        <div className={`toolbar-layout inline-flex ${flexClass} items-center gap-1`}>
            {content}
        </div>
    );
};
