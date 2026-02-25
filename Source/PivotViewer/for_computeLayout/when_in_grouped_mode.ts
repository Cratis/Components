// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { computeLayout } from '../engine/layout';
import type { GroupingResult, LayoutResult, LayoutSpec } from '../engine/types';

describe('when computing grouped layout', () => {
    const grouping: GroupingResult = {
        groups: [
            { key: 'A', label: 'Group A', value: 'A', ids: new Uint32Array([0, 1]), count: 2 },
            { key: 'B', label: 'Group B', value: 'B', ids: new Uint32Array([2, 3, 4]), count: 3 },
        ],
    };
    const spec: LayoutSpec = {
        viewMode: 'grouped',
        cardWidth: 200,
        cardHeight: 176,
        cardsPerColumn: 5,
        groupSpacing: 20,
        containerWidth: 700,
        containerHeight: 600,
    };
    let result: LayoutResult;

    beforeEach(() => {
        result = computeLayout(grouping, spec);
    });

    it('should produce a position for every item', () => {
        result.positions.size.should.equal(5);
    });

    it('should produce bucket widths for each group', () => {
        result.bucketWidths!.should.have.lengthOf(2);
    });

    it('should produce group x positions for each group', () => {
        result.groupXs!.should.have.lengthOf(2);
    });

    it('should position the first group at x zero', () => {
        result.groupXs![0].should.equal(0);
    });

    it('should position the second group to the right of the first', () => {
        result.groupXs![1].should.be.greaterThan(result.groupXs![0]);
    });
});
