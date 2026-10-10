// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sinon from 'sinon';
import { vi } from 'vitest';
import { startAnimationLoop } from '../components/pivot/animation';
import { syncScrollSprites } from '../components/pivot/syncScrollSprites';
import { syncSpritesToViewport } from '../components/pivot/visibility';
import { clearSpritePool } from '../components/pivot/sprites';
import { a_scrollable_grid } from './given/a_scrollable_grid';

describe('when a large scroll stops', () => {
    let context: a_scrollable_grid;
    let clock: sinon.SinonFakeTimers;

    const animate = () => startAnimationLoop({
        mountedRef: { current: true },
        appRef: { current: null },
        animationFrameRef: context.animationFrameRef,
        isAnimatingRef: context.isAnimatingRef,
        needsRenderRef: context.needsRenderRef,
        spritesRef: { current: context.sprites },
        isViewTransitionRef: context.isViewTransitionRef,
        syncVisibility: () => syncSpritesToViewport({ ...context.params, sweepImmediately: true }),
    });

    beforeEach(() => {
        clock = sinon.useFakeTimers({ now: 1000 });
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
            setTimeout(() => callback(Date.now()), 16));
        vi.stubGlobal('cancelAnimationFrame', (handle: ReturnType<typeof setTimeout>) => clearTimeout(handle));
        context = new a_scrollable_grid();

        // Follow the initial render path, including its transition-complete visibility sync.
        syncSpritesToViewport(context.params);
        animate();
        clock.tick(2000);
        context.visibleIds.length.should.be.greaterThan(0);
        context.missingOrMisplacedIds.should.deep.equal([]);

        // Jump beyond the old prefetch buffer and process the native scroll frame.
        context.container.scrollTop = 8000;
        syncScrollSprites(context.params, null);
        context.needsRenderRef.current = true;
        animate();
        // PivotViewer also updates scrollPosition, triggering the normal sprite-sync effect.
        syncSpritesToViewport({ ...context.params, panY: context.container.scrollTop });
        context.needsRenderRef.current = true;
        animate();
        // Then input stops. Give any scheduled animation loop ample time to fill the viewport.
        clock.tick(2000);
    });

    afterEach(() => {
        context.root.destroy({ children: true });
        clearSpritePool();
        clock.restore();
        vi.unstubAllGlobals();
    });

    it('should keep every card intersecting the settled viewport attached visible and at its target', () => {
        context.visibleIds.length.should.be.greaterThan(0);
        context.missingOrMisplacedIds.should.deep.equal([]);
    });
});
