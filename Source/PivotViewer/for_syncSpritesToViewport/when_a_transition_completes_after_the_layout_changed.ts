// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sinon from 'sinon';
import { clearSpritePool } from '../components/pivot/sprites';
import { createTransitionCompleteSync, syncSpritesToViewport } from '../components/pivot/visibility';
import { a_scrollable_grid } from './given/a_scrollable_grid';

describe('when a transition completes after the layout changed', () => {
    let context: a_scrollable_grid;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        clock = sinon.useFakeTimers({ now: 1000 });
        context = new a_scrollable_grid();

        // The transition started with a layout that put other cards in the viewport.
        const startLayout = context.layout;
        context.layout = {
            positions: new Map([...startLayout.positions].map(([id, position]) =>
                [id, { ...position, y: position.y + 100000 }] as const)),
            totalWidth: startLayout.totalWidth,
            totalHeight: startLayout.totalHeight + 100000,
        };
        syncSpritesToViewport(context.params);

        // The layout and scroll position changed while the transition was running.
        context.layout = startLayout;
        context.container.scrollTop = 3000;
        syncSpritesToViewport({ ...context.params, isViewTransition: false });
        clock.tick(1000);

        createTransitionCompleteSync(() => context.params)();
    });

    afterEach(() => {
        context.root.destroy({ children: true });
        clearSpritePool();
        clock.restore();
    });

    it('should keep every card on screen attached visible and at its target', () => {
        context.visibleIds.length.should.be.greaterThan(0);
        context.missingOrMisplacedIds.should.deep.equal([]);
    });
});
