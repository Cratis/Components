// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sinon from 'sinon';
import { syncSpritesToViewport } from '../components/pivot/visibility';
import { clearSpritePool } from '../components/pivot/sprites';
import { a_transition } from './given/a_transition';

describe('when a swept transition card is still at its previous position', () => {
    let context: a_transition;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        clock = sinon.useFakeTimers({ now: 1000 });
        context = new a_transition();
        context.layout.positions.set(6, { x: 10, y: 16000, groupIndex: 0 });
        context.previousLayout.positions.set(6, { x: 10, y: 100, groupIndex: 0 });
        syncSpritesToViewport(context.params);
        const sprite = context.sprites.get(6)!;
        sprite.currentY = 16000;
        syncSpritesToViewport(context.params);
        clock.tick(200);
        syncSpritesToViewport(context.params);
        syncSpritesToViewport(context.params);
    });

    afterEach(() => {
        clock.restore();
        clearSpritePool();
    });

    it('should not recreate the card from its previous position', () => {
        context.createdIds.should.deep.equal([6]);
    });
});
