// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sinon from 'sinon';
import { syncSpritesToViewport } from '../components/pivot/visibility';
import { clearSpritePool } from '../components/pivot/sprites';
import { a_transition } from './given/a_transition';

describe('when a transition card leaves the viewport', () => {
    let context: a_transition;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        clock = sinon.useFakeTimers({ now: 1000 });
        context = new a_transition();
        context.layout.positions.set(6, { x: 10, y: 16000, groupIndex: 0 });
        const sprite = context.params.createCardSprite(6, 10, 16000);
        context.sprites.set(6, sprite);
        syncSpritesToViewport(context.params);
        clock.tick(200);
        syncSpritesToViewport(context.params);
    });

    afterEach(() => {
        clock.restore();
        clearSpritePool();
    });

    it('should release the offscreen card instead of keeping it for the entire transition', () => {
        context.sprites.has(6).should.be.false;
    });
});
