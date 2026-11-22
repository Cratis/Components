// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { createCardSprite } from '../../components/pivot/sprites';
import { DEFAULT_COLORS } from '../../components/pivot/constants';

export class a_card {
    items = [{ title: 'Example Card', labels: ['Label'], values: ['Example Value'] }];
    onCardClick = vi.fn();
    onPanStart = vi.fn();
    colors = { ...DEFAULT_COLORS };
    width = 128;
    height = 100;
    renderer = (item: typeof this.items[number]) => item;
    resolveId = (_item: typeof this.items[number], index: number) => index;

    constructor() {
        // Keep Pixi's geometry and event handling, replacing only canvas gradient rasterization.
        vi.spyOn(PIXI.FillGradient.prototype, 'buildGradient').mockImplementation(function () {
            this.texture = PIXI.Texture.WHITE;
        });
    }

    create(id: string | number = 0, x = 20, y = 30) {
        return createCardSprite(id, x, y, this.items, this.onCardClick, this.onPanStart,
            this.width, this.height, this.colors, this.renderer, this.resolveId);
    }
}
