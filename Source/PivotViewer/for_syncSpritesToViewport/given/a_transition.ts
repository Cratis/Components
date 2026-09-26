// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import type { LayoutResult } from '../../engine/types';
import type { CardSprite } from '../../components/pivot/constants';
import type { SyncParams } from '../../components/pivot/visibility';

export class a_transition {
    root = new PIXI.Container();
    container = { clientWidth: 200, clientHeight: 200, scrollLeft: 0, scrollTop: 0 } as HTMLDivElement;
    sprites = new Map<number | string, CardSprite>();
    transitionSeenIds = new Set<number | string>();
    layout: LayoutResult = {
        positions: new Map(Array.from({ length: 5 }, (_, index) => [index, { x: 0, y: 15000 + index * 30, groupIndex: 0 }] as const)),
        totalWidth: 200,
        totalHeight: 50000,
    };
    previousLayout: LayoutResult = { positions: new Map(), totalWidth: 200, totalHeight: 50000 };
    createdIds: (number | string)[] = [];

    get params(): SyncParams<{ name: string }> {
        return {
            root: this.root,
            container: this.container,
            sprites: this.sprites,
            layout: this.layout,
            prevLayout: this.previousLayout,
            transitionSeenIds: this.transitionSeenIds,
            visibleIds: new Uint32Array(),
            items: [],
            cardWidth: 20,
            cardHeight: 20,
            panX: 0,
            panY: 0,
            viewportWidth: 200,
            viewportHeight: 200,
            zoomLevel: 1,
            viewMode: 'collection',
            isViewTransition: true,
            createCardSprite: (id, x, y) => {
                this.createdIds.push(id);
                return {
                    itemId: id,
                    container: new PIXI.Container(),
                    currentX: x,
                    currentY: y,
                    targetX: x,
                    targetY: y,
                } as CardSprite;
            },
            updateCardContent: () => {},
        };
    }
}
