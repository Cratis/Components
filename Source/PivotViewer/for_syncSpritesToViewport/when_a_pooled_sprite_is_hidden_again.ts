// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sinon from 'sinon';
import { createCardSprite, destroySprite, clearSpritePool } from '../components/pivot/sprites';
import { DEFAULT_COLORS } from '../components/pivot/constants';
import { syncSpritesToViewport } from '../components/pivot/visibility';
import { a_transition } from './given/a_transition';

describe('when a pooled sprite is hidden again', () => {
    let context: a_transition;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        clock = sinon.useFakeTimers({ now: 1000 });
        context = new a_transition();
        const oldSprite = context.params.createCardSprite(6, 10, 16000);
        (oldSprite as unknown as { __lastHiddenAt: number }).__lastHiddenAt = 1000;
        destroySprite(oldSprite);
        clock.tick(500);
        const reusedSprite = createCardSprite(
            7, 10, 16000, [{ name: 'Sample User' }], () => {}, () => {},
            20, 20, DEFAULT_COLORS, item => ({ title: item.name }), item => item.name,
        );
        context.layout.positions.set(7, { x: 10, y: 16000, groupIndex: 0 });
        context.sprites.set(7, reusedSprite);
        syncSpritesToViewport(context.params);
    });

    afterEach(() => {
        clock.restore();
        clearSpritePool();
    });

    it('should retain the freshly hidden sprite for the sweep grace period', () => {
        context.sprites.has(7).should.be.true;
    });
});
