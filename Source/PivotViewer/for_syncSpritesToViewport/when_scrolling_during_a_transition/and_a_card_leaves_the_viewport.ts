// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { syncSpritesToViewport } from '../../components/pivot/visibility';
import { a_transition } from '../given/a_transition';

describe('when scrolling during a transition and a card leaves the viewport', () => {
    let context: a_transition;

    beforeEach(() => {
        context = new a_transition();
        context.layout.positions.set(6, { x: 10, y: 16000, groupIndex: 0 });
        context.previousLayout.positions.set(6, { x: 10, y: 100, groupIndex: 0 });
        syncSpritesToViewport(context.params);
        context.container.scrollTop = 1000;
        syncSpritesToViewport({ ...context.params, prevScrollTop: 0 });
    });

    it('should stop displaying the card left behind by the scroll', () => {
        context.sprites.get(6)!.container.visible.should.be.false;
    });
});
