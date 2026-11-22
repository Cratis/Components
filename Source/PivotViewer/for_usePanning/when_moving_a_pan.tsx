// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, describe, it } from 'vitest';
import { a_panning_hook } from './given/a_panning_hook';

let context: a_panning_hook;

afterEach(() => context.unmount());

describe('when moving a pan that has not started', () => {
    it('should leave the scroll position alone', () => {
        context = new a_panning_hook();
        context.move(0, 0);
        context.container.scrollLeft.should.equal(50);
        context.onScrollChange.mock.calls.length.should.equal(0);
    });
});

describe('when moving a pan within the content bounds', () => {
    it('should scroll opposite to the drag, rounded, and report the scroll', () => {
        context = new a_panning_hook();
        context.start(context.event({ clientX: 100, clientY: 100 }));
        context.move(39.6, 95);
        context.container.scrollLeft.should.equal(110);
        context.container.scrollTop.should.equal(25);
        context.onScrollChange.mock.calls.should.deep.equal([[{ x: 110, y: 25 }]]);
    });
});

describe('when moving a pan beyond the content bounds', () => {
    it('should clamp the scroll position to the scrollable range', () => {
        context = new a_panning_hook();
        context.start(context.event({ clientX: 100, clientY: 100 }));
        context.move(-1000, 1000);
        context.container.scrollLeft.should.equal(800);
        context.container.scrollTop.should.equal(0);
    });
});

describe('when moving a pan without a scroll change callback', () => {
    it('should still scroll the container', () => {
        context = new a_panning_hook(false);
        context.start(context.event({ clientX: 100, clientY: 100 }));
        context.move(90, 100);
        context.container.scrollLeft.should.equal(60);
    });
});
