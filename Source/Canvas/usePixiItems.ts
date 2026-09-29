// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, type RefObject } from 'react';
import * as PIXI from 'pixi.js';
import type { CanvasItemData } from './CanvasItemData';

/** The Pixi world and the items {@link usePixiItems} keeps in sync. */
export interface PixiItemsOptions<T extends CanvasItemData> {
    pixiReady: boolean;
    appRef: RefObject<PIXI.Application | null>;
    worldRef: RefObject<PIXI.Container | null>;
    spritesRef: RefObject<Map<string, PIXI.Container>>;
    items: T[];
    renderItem?: (item: T) => PIXI.Container;
    onItemPointerDownRef: RefObject<
        ((item: T, event: PIXI.FederatedPointerEvent) => void) | undefined
    >;
}

/**
 * Adds, moves and removes the Pixi containers for the items, rendering once after each change.
 * @param options The world, sprites and items.
 */
export const usePixiItems = <T extends CanvasItemData>({
    pixiReady,
    appRef,
    worldRef,
    spritesRef,
    items,
    renderItem,
    onItemPointerDownRef,
}: PixiItemsOptions<T>) => {
    // Sync items → PIXI containers
    useEffect(() => {
        const world = worldRef.current;
        if (!pixiReady || !world || !renderItem) return;

        const incoming = new Map(items.map((item) => [item.id, item]));

        // Remove deleted items
        spritesRef.current.forEach((container, id) => {
            if (!incoming.has(id)) {
                world.removeChild(container);
                container.destroy({ children: true });
                spritesRef.current.delete(id);
            }
        });

        // Add new items; update positions of existing ones
        items.forEach((item) => {
            const existing = spritesRef.current.get(item.id);
            if (existing) {
                existing.position.set(item.x, item.y);
                // Refresh handler so it always references the latest item object
                existing.removeAllListeners('pointerdown');
                existing.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
                    onItemPointerDownRef.current?.(item, event);
                });
            } else {
                const container = renderItem(item);
                container.position.set(item.x, item.y);
                container.eventMode = 'static';
                container.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
                    onItemPointerDownRef.current?.(item, event);
                });
                world.addChild(container);
                spritesRef.current.set(item.id, container);
            }
        });

        // Render directly (not via the empty-world-skipping render()) so removing the last item
        // still clears its pixels from the canvas.
        appRef.current?.renderer.render(appRef.current.stage);
    }, [
        pixiReady,
        items,
        renderItem,
        appRef,
        onItemPointerDownRef,
        spritesRef,
        worldRef,
    ]);
};
