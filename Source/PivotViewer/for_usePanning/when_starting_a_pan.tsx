// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it } from 'vitest';
import { a_panning_hook } from './given/a_panning_hook';

let context: a_panning_hook;

beforeEach(() => { context = new a_panning_hook(); });
afterEach(() => context.unmount());

describe('when starting a pan with the left button on the background', () => {
    it('should pan and prevent the default action', () => {
        const event = context.event({ clientX: 10, clientY: 10 });
        context.start(event);
        context.result.isPanning.should.equal(true);
        event.preventDefault.mock.calls.length.should.equal(1);
    });
});

describe('when starting a pan with the left button on a card found through the DOM', () => {
    it('should not pan', () => {
        const event = context.event({ onCard: true });
        context.start(event);
        context.result.isPanning.should.equal(false);
        event.preventDefault.mock.calls.length.should.equal(0);
    });
});

describe('when starting a pan with the left button on a card reported explicitly', () => {
    it('should not pan even though the DOM target is not a card', () => {
        context.start(context.event(), true);
        context.result.isPanning.should.equal(false);
    });
});

describe('when starting a pan with the background reported explicitly over a card target', () => {
    it('should pan', () => {
        context.start(context.event({ onCard: true }), false);
        context.result.isPanning.should.equal(true);
    });
});

describe('when starting a pan with alt and the left button on a card', () => {
    it('should pan without preventing the default action', () => {
        const event = context.event({ altKey: true });
        context.start(event, true);
        context.result.isPanning.should.equal(true);
        event.preventDefault.mock.calls.length.should.equal(0);
    });
});

describe('when starting a pan with the middle button on a card', () => {
    it('should pan', () => {
        context.start(context.event({ button: 1 }), true);
        context.result.isPanning.should.equal(true);
    });
});

describe('when starting a pan with the right button on the background', () => {
    it('should not pan', () => {
        context.start(context.event({ button: 2 }));
        context.result.isPanning.should.equal(false);
    });
});

describe('when starting a pan while inertia is still running', () => {
    it('should cancel the running inertia frame', () => {
        context.start(context.event({ clientX: 100, clientY: 0 }));
        context.now = 10;
        context.move(80, 0);
        context.end();
        const [running] = [...context.frames.keys()];
        context.start(context.event());
        context.cancelledFrames.should.deep.equal([running]);
    });
});
