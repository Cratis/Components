// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CANVAS_SURFACE_CLASS } from '../isClaimedByAnotherSurface';
import { CanvasWithZoomListeners } from './a_canvas_with_zoom_listeners';

// The canvas behind lies under the dialog: the pinch is inside its rectangle, but on the dialog's own canvas.
describe('when pinching over a canvas in a dialog in front of the canvas', () => {
    let canvas: CanvasWithZoomListeners;
    let dialog: HTMLElement;
    let dialogCanvas: HTMLElement;

    beforeEach(() => {
        canvas = new CanvasWithZoomListeners();
        dialog = document.createElement('div');
        dialog.setAttribute('aria-modal', 'true');
        dialogCanvas = document.createElement('div');
        dialogCanvas.className = CANVAS_SURFACE_CLASS;
        dialog.append(dialogCanvas);
        document.body.append(dialog);
        canvas.gesture(dialogCanvas, 'gesturestart', 1, { x: 300, y: 200 });
        canvas.gesture(dialogCanvas, 'gesturechange', 2, { x: 300, y: 200 });
        canvas.wheel(dialogCanvas, { ctrlKey: true, deltaY: -50, clientX: 300, clientY: 200 });
    });

    afterEach(() => {
        canvas.dispose();
        dialog.remove();
    });

    it('should not zoom the canvas behind', () => expect(canvas.zoomTowards.mock.calls.length).to.equal(0));
});

describe('when pinching over a canvas nested in the canvas', () => {
    let canvas: CanvasWithZoomListeners;
    let nested: HTMLElement;

    beforeEach(() => {
        canvas = new CanvasWithZoomListeners();
        nested = document.createElement('div');
        nested.className = CANVAS_SURFACE_CLASS;
        canvas.container.append(nested);
        canvas.gesture(nested, 'gesturestart', 1, { x: 300, y: 200 });
        canvas.gesture(nested, 'gesturechange', 2, { x: 300, y: 200 });
        canvas.wheel(nested, { ctrlKey: true, deltaY: -50, clientX: 300, clientY: 200 });
    });

    afterEach(() => canvas.dispose());

    it('should leave the zoom to the nested canvas', () => expect(canvas.zoomTowards.mock.calls.length).to.equal(0));
});
