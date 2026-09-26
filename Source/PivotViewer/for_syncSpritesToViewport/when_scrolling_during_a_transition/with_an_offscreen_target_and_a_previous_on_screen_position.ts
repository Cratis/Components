// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { syncScrollSprites } from '../../components/pivot/syncScrollSprites';
import { a_transition } from '../given/a_transition';

describe('when scrolling during a transition with an offscreen target and a previous on-screen position', () => {
    let context: a_transition;

    beforeEach(() => {
        context = new a_transition();
        context.layout.positions.set(6, { x: 10, y: 16000, groupIndex: 0 });
        context.previousLayout.positions.set(6, { x: 10, y: 100, groupIndex: 0 });
        const { prevLayout: _previousLayout, ...scrollParams } = context.params;
        syncScrollSprites(scrollParams, context.previousLayout);
    });

    it('should create the card at its previous on-screen position', () => {
        context.sprites.get(6)!.currentY.should.equal(100);
    });
});
