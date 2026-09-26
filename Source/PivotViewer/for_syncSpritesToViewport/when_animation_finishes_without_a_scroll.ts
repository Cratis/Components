// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sinon from 'sinon';
import { startAnimationLoop } from '../components/pivot/animation';
import { syncSpritesToViewport } from '../components/pivot/visibility';
import { clearSpritePool } from '../components/pivot/sprites';
import { a_transition } from './given/a_transition';

describe('when animation finishes without a scroll', () => {
    let context: a_transition;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        clock = sinon.useFakeTimers({ now: 1000 });
        context = new a_transition();
        context.layout.positions.set(6, { x: 10, y: 16000, groupIndex: 0 });
        context.previousLayout.positions.set(6, { x: 10, y: 100, groupIndex: 0 });
        syncSpritesToViewport(context.params);
        const sprite = context.sprites.get(6)!;
        sprite.animationStartTime = 1000;
        sprite.animationDelay = 0;
        clock.tick(1000);
        const isViewTransitionRef = { current: true };
        startAnimationLoop({
            mountedRef: { current: true },
            appRef: { current: null },
            animationFrameRef: { current: 0 },
            isAnimatingRef: { current: false },
            needsRenderRef: { current: false },
            spritesRef: { current: context.sprites },
            isViewTransitionRef,
            onTransitionComplete: () => context.transitionSeenIds.clear(),
            syncVisibility: () => syncSpritesToViewport({ ...context.params, isViewTransition: isViewTransitionRef.current, sweepImmediately: true }),
        });
    });

    afterEach(() => {
        clock.restore();
        clearSpritePool();
    });

    it('should release the card that finished offscreen', () => {
        context.sprites.has(6).should.be.false;
    });
});
