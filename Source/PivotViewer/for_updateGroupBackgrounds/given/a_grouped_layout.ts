// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import type { GroupingResult, LayoutResult } from '../../engine/types';

export class a_grouped_layout {
    root = new PIXI.Container();
    highlight = new PIXI.Graphics();
    // SAFETY: Group decoration reads only these viewport height fields.
    container = { clientHeight: 100, scrollHeight: 200 } as HTMLDivElement;
    grouping: GroupingResult = {
        groups: [0, 1, 2].map(id => ({
            key: String(id), label: `Example Group ${id}`, value: id, ids: Uint32Array.of(id), count: 1,
        })),
    };
    layout: LayoutResult = {
        positions: new Map([0, 1, 2].map(id => [id, { x: 10 + id * 40, y: 20, groupIndex: id }])),
        totalWidth: 120, totalHeight: 100, bucketWidths: [40, 40, 40], groupXs: [10, 50, 90],
    };

    constructor() {
        this.highlight.label = 'highlight';
        this.root.addChild(this.highlight);
    }
}
