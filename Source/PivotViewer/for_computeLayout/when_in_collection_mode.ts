// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { computeLayout } from '../engine/layout';
import type { GroupingResult, LayoutResult, LayoutSpec } from '../engine/types';

describe('when computing collection layout', () => {
    const grouping: GroupingResult = {
        groups: [
            { key: 'all', label: 'All', value: null, ids: new Uint32Array([0, 1, 2, 3, 4]), count: 5 },
        ],
    };
    const spec: LayoutSpec = {
        viewMode: 'collection',
        cardWidth: 200,
        cardHeight: 176,
        cardsPerColumn: 5,
        groupSpacing: 20,
        containerWidth: 700,
    };
    let result: LayoutResult;

    beforeEach(() => {
        result = computeLayout(grouping, spec);
    });

    it('should produce a position for every item', () => {
        result.positions.size.should.equal(5);
    });

    it('should start the first item at the canvas padding position', () => {
        const first = result.positions.get(0);
        first!.x.should.be.greaterThanOrEqual(0);
        first!.y.should.be.greaterThanOrEqual(0);
    });

    it('should set a positive total width', () => {
        result.totalWidth.should.be.greaterThan(0);
    });

    it('should set a positive total height', () => {
        result.totalHeight.should.be.greaterThan(0);
    });
});
