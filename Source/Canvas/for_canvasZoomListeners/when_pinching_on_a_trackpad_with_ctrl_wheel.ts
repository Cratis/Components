// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CanvasWithZoomListeners } from './a_canvas_with_zoom_listeners';

describe('when pinching on a trackpad with ctrl wheel events', () => {
    let canvas: CanvasWithZoomListeners;
    let event: WheelEvent;
    let outsideEvent: WheelEvent;
    let portalledEvent: WheelEvent;

    beforeEach(() => {
        canvas = new CanvasWithZoomListeners();
        event = canvas.wheel(canvas.container, { ctrlKey: true, deltaY: -50, clientX: 300, clientY: 200 });
        portalledEvent = canvas.wheel(canvas.sibling, { ctrlKey: true, deltaY: -50, clientX: 300, clientY: 200 });
        outsideEvent = canvas.wheel(canvas.sibling, { ctrlKey: true, deltaY: -50, clientX: 10, clientY: 10 });
    });

    afterEach(() => canvas.dispose());

    it('should cancel the browser page zoom', () => expect(event.defaultPrevented).to.be.true);

    it('should cancel the page zoom over floating content portalled outside the canvas', () =>
        expect(portalledEvent.defaultPrevented).to.be.true);

    it('should leave the page zoom alone away from the canvas', () =>
        expect(outsideEvent.defaultPrevented).to.be.false);

    it('should zoom in towards the pointer relative to the canvas', () => {
        const [focusX, focusY, factor] = canvas.zoomTowards.mock.calls[0];
        expect(focusX).to.equal(200);
        expect(focusY).to.equal(150);
        expect(factor).to.be.greaterThan(1);
    });

    it('should zoom once, not again for the window-level listener', () =>
        expect(canvas.zoomTowards.mock.calls.length).to.equal(1));
});

describe('when scrolling with the wheel without ctrl', () => {
    let canvas: CanvasWithZoomListeners;

    beforeEach(() => {
        canvas = new CanvasWithZoomListeners();
        canvas.wheel(canvas.container, { deltaX: 5, deltaY: 10, clientX: 300, clientY: 200 });
    });

    afterEach(() => canvas.dispose());

    it('should pan instead of zooming', () => {
        expect(canvas.zoomTowards.mock.calls.length).to.equal(0);
        expect(canvas.pan).to.deep.equal({ x: -5, y: -10 });
    });
});
