// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CanvasWithZoomListeners } from './a_canvas_with_zoom_listeners';

describe('when pinching with safari gesture events over the canvas', () => {
    let canvas: CanvasWithZoomListeners;
    let events: Event[];

    beforeEach(() => {
        canvas = new CanvasWithZoomListeners();
        events = [
            canvas.gesture(canvas.container, 'gesturestart', 1, { x: 300, y: 200 }),
            canvas.gesture(canvas.container, 'gesturechange', 1.5, { x: 300, y: 200 }),
            canvas.gesture(canvas.container, 'gesturechange', 3, { x: 300, y: 200 }),
            canvas.gesture(canvas.container, 'gestureend', 3, { x: 300, y: 200 }),
        ];
    });

    afterEach(() => canvas.dispose());

    it('should cancel the browser page zoom for every gesture event', () =>
        expect(events.every(event => event.defaultPrevented)).to.be.true);

    it('should zoom by the incremental scale of each change', () => {
        const factors = canvas.zoomTowards.mock.calls.map(call => call[2]);
        expect(factors).to.deep.equal([1.5, 2]);
    });

    it('should zoom towards the gesture focus relative to the canvas', () => {
        expect(canvas.zoomTowards.mock.calls[0][0]).to.equal(200);
        expect(canvas.zoomTowards.mock.calls[0][1]).to.equal(150);
    });
});

describe('when pinching over floating content portalled outside the canvas', () => {
    let canvas: CanvasWithZoomListeners;
    let change: Event;

    beforeEach(() => {
        canvas = new CanvasWithZoomListeners();
        canvas.gesture(canvas.sibling, 'gesturestart', 1, { x: 300, y: 200 });
        change = canvas.gesture(canvas.sibling, 'gesturechange', 2, { x: 300, y: 200 });
    });

    afterEach(() => canvas.dispose());

    it('should cancel the browser page zoom', () => expect(change.defaultPrevented).to.be.true);

    it('should still zoom the canvas', () => expect(canvas.zoomTowards.mock.calls.map(call => call[2])).to.deep.equal([2]));
});

describe('when pinching away from the canvas', () => {
    let canvas: CanvasWithZoomListeners;
    let change: Event;

    beforeEach(() => {
        canvas = new CanvasWithZoomListeners();
        canvas.gesture(canvas.sibling, 'gesturestart', 1, { x: 10, y: 10 });
        change = canvas.gesture(canvas.sibling, 'gesturechange', 2, { x: 10, y: 10 });
    });

    afterEach(() => canvas.dispose());

    it('should leave the page zoom alone', () => expect(change.defaultPrevented).to.be.false);

    it('should not zoom the canvas', () => expect(canvas.zoomTowards.mock.calls.length).to.equal(0));
});

describe('when pinching and the browser reports no gesture coordinates', () => {
    let canvas: CanvasWithZoomListeners;
    let change: Event;

    beforeEach(() => {
        canvas = new CanvasWithZoomListeners();
        canvas.sibling.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 400, clientY: 250 }));
        canvas.gesture(canvas.sibling, 'gesturestart', 1);
        change = canvas.gesture(canvas.sibling, 'gesturechange', 2);
    });

    afterEach(() => canvas.dispose());

    it('should cancel the browser page zoom using the last pointer position', () =>
        expect(change.defaultPrevented).to.be.true);

    it('should zoom towards the last pointer position rather than a NaN focus', () => {
        const [focusX, focusY, factor] = canvas.zoomTowards.mock.calls[0];
        expect(focusX).to.equal(300);
        expect(focusY).to.equal(200);
        expect(factor).to.equal(2);
    });
});

describe('when pinching with no coordinates and no pointer ever seen', () => {
    let canvas: CanvasWithZoomListeners;

    beforeEach(() => {
        canvas = new CanvasWithZoomListeners();
        canvas.gesture(canvas.container, 'gesturestart', 1);
        canvas.gesture(canvas.container, 'gesturechange', 2);
    });

    afterEach(() => canvas.dispose());

    it('should zoom towards the canvas centre', () => {
        const [focusX, focusY] = canvas.zoomTowards.mock.calls[0];
        expect(focusX).to.equal(200);
        expect(focusY).to.equal(150);
    });
});

describe('when a touch pinch is in progress alongside safari gesture events', () => {
    let canvas: CanvasWithZoomListeners;
    let change: Event;

    beforeEach(() => {
        canvas = new CanvasWithZoomListeners();
        canvas.touchPointers.set(1, { x: 200, y: 200 });
        canvas.touchPointers.set(2, { x: 300, y: 200 });
        canvas.gesture(canvas.container, 'gesturestart', 1, { x: 250, y: 200 });
        change = canvas.gesture(canvas.container, 'gesturechange', 2, { x: 250, y: 200 });
    });

    afterEach(() => canvas.dispose());

    it('should cancel the browser page zoom', () => expect(change.defaultPrevented).to.be.true);

    it('should leave the zooming to the touch pinch so it does not double up', () =>
        expect(canvas.zoomTowards.mock.calls.length).to.equal(0));
});

describe('when the listeners are detached', () => {
    let canvas: CanvasWithZoomListeners;
    let event: WheelEvent;

    beforeEach(() => {
        canvas = new CanvasWithZoomListeners();
        canvas.dispose();
        event = canvas.wheel(canvas.container, { ctrlKey: true, deltaY: -50, clientX: 300, clientY: 200 });
    });

    it('should no longer intercept the wheel', () => expect(event.defaultPrevented).to.be.false);
});
