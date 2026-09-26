// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { syncSpritesToViewport } from '../../components/pivot/visibility';
import { a_transition } from '../given/a_transition';

describe('when transitioning with offscreen target positions', () => {
    let context: a_transition;

    beforeEach(() => {
        context = new a_transition();
        context.layout.positions.set(6, { x: 10, y: 16000, groupIndex: 0 });
        context.previousLayout.positions.set(6, { x: 10, y: 100, groupIndex: 0 });
        syncSpritesToViewport(context.params);
    });

    it('should create the card at its previous on-screen position', () => {
        context.createdIds.should.contain(6);
        context.sprites.get(6)!.currentY.should.equal(100);
    });

});
