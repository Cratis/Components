// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import { computeLayout } from '../../engine/layout';
import type { CardSprite } from '../../components/pivot/constants';
import type { SyncParams } from '../../components/pivot/visibility';

export class a_scrollable_grid {
    root = new PIXI.Container();
    container = { clientWidth: 800, clientHeight: 600, scrollLeft: 0, scrollTop: 0 } as HTMLDivElement;
    sprites = new Map<number | string, CardSprite>();
    items = Array.from({ length: 1000 }, (_, index) => ({ name: `Sample Item ${index}` }));
    ids = Uint32Array.from(this.items, (_, index) => index);
    layout = computeLayout({
        groups: [{ key: 'example', label: 'Example Group', value: 'example', ids: this.ids, count: this.items.length }],
    }, {
        viewMode: 'collection', cardWidth: 100, cardHeight: 100, cardsPerColumn: 6,
        groupSpacing: 0, containerWidth: 800, containerHeight: 600,
    });
    animationFrameRef = { current: 0 };
    isViewTransitionRef = { current: true };
    isAnimatingRef = { current: false };
    needsRenderRef = { current: true };

    get params(): SyncParams<{ name: string }> {
        return {
            root: this.root, container: this.container, sprites: this.sprites,
            layout: this.layout, visibleIds: this.ids, items: this.items,
            cardWidth: 100, cardHeight: 100, panX: 0, panY: 0,
            viewportWidth: 800, viewportHeight: 600, zoomLevel: 1, viewMode: 'collection',
            isViewTransition: this.isViewTransitionRef.current,
            transitionSeenIds: new Set(),
            createCardSprite: (id, x, y) => ({
                itemId: id, container: new PIXI.Container(),
                currentX: x, currentY: y, targetX: x, targetY: y,
            } as CardSprite),
            updateCardContent: () => {},
        };
    }

    // Only the actual visible rectangle counts, not the much larger prefetch buffer.
    get visibleIds() {
        return [...this.layout.positions].filter(([, position]) =>
            position.x + 100 > this.container.scrollLeft &&
            position.x < this.container.scrollLeft + this.container.clientWidth &&
            position.y + 100 > this.container.scrollTop &&
            position.y < this.container.scrollTop + this.container.clientHeight,
        ).map(([id]) => id);
    }

    get missingOrMisplacedIds() {
        return this.visibleIds.filter(id => {
            const sprite = this.sprites.get(id);
            const position = this.layout.positions.get(id)!;
            return !sprite || sprite.container.parent !== this.root || !sprite.container.visible ||
                sprite.container.x !== position.x || sprite.container.y !== position.y;
        });
    }
}
