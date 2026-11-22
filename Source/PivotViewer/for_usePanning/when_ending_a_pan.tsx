// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it } from 'vitest';
import { a_panning_hook } from './given/a_panning_hook';

let context: a_panning_hook;

beforeEach(() => { context = new a_panning_hook(); });
afterEach(() => context.unmount());

describe('when ending a pan on the background without dragging', () => {
    it('should report a background click and stop panning', () => {
        context.start(context.event({ clientX: 100, clientY: 100 }));
        context.move(102, 97);
        context.end();
        context.onBackgroundClick.mock.calls.length.should.equal(1);
        context.result.isPanning.should.equal(false);
    });
});

describe('when ending a pan on the background after dragging', () => {
    it('should not report a background click', () => {
        context.start(context.event({ clientX: 100, clientY: 100 }));
        context.move(100, 96);
        context.end();
        context.onBackgroundClick.mock.calls.length.should.equal(0);
    });
});

describe('when ending a press on a card', () => {
    it('should not report a background click or start inertia', () => {
        context.start(context.event(), true);
        context.end();
        context.onBackgroundClick.mock.calls.length.should.equal(0);
        context.frames.size.should.equal(0);
    });
});

describe('when ending a slow pan', () => {
    it('should not start inertia', () => {
        context.start(context.event({ clientX: 100, clientY: 0 }));
        context.now = 40;
        context.move(90, 0);
        context.end();
        context.frames.size.should.equal(0);
    });
});

describe('when ending a pan whose moves were too far apart to measure', () => {
    it('should not start inertia', () => {
        context.start(context.event({ clientX: 100, clientY: 0 }));
        context.now = 60;
        context.move(0, 0);
        context.end();
        context.frames.size.should.equal(0);
    });
});

describe('when ending a fast pan', () => {
    beforeEach(() => {
        context.start(context.event({ clientX: 100, clientY: 0 }));
        context.now = 10;
        context.move(80, 0);
        context.end();
    });

    it('should coast the scroll position by the smoothed velocity', () => {
        context.container.scrollLeft.should.equal(70);
        context.runFrame();
        context.container.scrollLeft.should.equal(86);
        context.runFrame();
        context.container.scrollLeft.should.equal(86 + 16 * 0.95);
    });

    it('should stop once the coasting speed falls below the threshold', () => {
        let frames = 0;
        while (context.frames.size > 0 && frames < 1000) {
            context.runFrame();
            frames++;
        }
        frames.should.equal(69);
        context.frames.size.should.equal(0);
    });
});
