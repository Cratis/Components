// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, describe, it } from 'vitest';
import { a_pointer_gesture_surface } from './given/a_pointer_gesture_surface';

let context: a_pointer_gesture_surface;

afterEach(() => context.unmount());

describe('when dragging the background with the left button', () => {
    it('should capture the pointer, pan by the movement and show the grabbing cursor', () => {
        context = new a_pointer_gesture_surface();
        const event = context.down(context.event({ pointerId: 7, clientX: 100, clientY: 100 }));
        context.container.style.cursor.should.equal('grabbing');
        context.capturedPointers.should.deep.equal([7]);
        event.preventDefault.mock.calls.length.should.equal(0);
        context.move({ clientX: 103, clientY: 95 });
        context.panRef.current.should.deep.equal({ x: 13, y: 15 });
        context.calls.should.deep.equal(['noteGestureActivity', 'scheduleTransformApply']);
    });

    it('should stop panning and restore the cursor on release without coasting', () => {
        context = new a_pointer_gesture_surface();
        context.down(context.event({ clientX: 100, clientY: 100 }));
        context.move({ clientX: 150, clientY: 100 });
        context.up({});
        context.container.style.cursor.should.equal('default');
        context.frames.size.should.equal(0);
        context.move({ clientX: 200, clientY: 100 });
        context.panRef.current.should.deep.equal({ x: 60, y: 20 });
    });
});

describe('when dragging the rendering canvas with the left button', () => {
    it('should pan', () => {
        context = new a_pointer_gesture_surface();
        context.down(context.event({ target: document.createElement('canvas') }));
        context.container.style.cursor.should.equal('grabbing');
    });
});

describe('when dragging content with the left button', () => {
    it('should not pan', () => {
        context = new a_pointer_gesture_surface();
        context.down(context.event({ target: document.createElement('div') }));
        context.capturedPointers.length.should.equal(0);
        context.move({ clientX: 50, clientY: 50 });
        context.panRef.current.should.deep.equal({ x: 10, y: 20 });
    });
});

describe('when dragging content with the left button on a read only surface', () => {
    it('should pan', () => {
        context = new a_pointer_gesture_surface({ readOnly: true });
        context.down(context.event({ target: document.createElement('div') }));
        context.capturedPointers.length.should.equal(1);
    });
});

describe('when dragging the background with the left button and the host claims background drags', () => {
    it('should not pan', () => {
        context = new a_pointer_gesture_surface({ backgroundDragPans: false });
        context.down(context.event());
        context.capturedPointers.length.should.equal(0);
    });
});

describe('when dragging content with the middle button', () => {
    it('should prevent the default action and pan', () => {
        context = new a_pointer_gesture_surface({ backgroundDragPans: false });
        const event = context.down(context.event({ button: 1, target: document.createElement('div') }));
        event.preventDefault.mock.calls.length.should.equal(1);
        context.capturedPointers.length.should.equal(1);
    });
});

describe('when dragging the background with the right button', () => {
    it('should not pan', () => {
        context = new a_pointer_gesture_surface();
        context.down(context.event({ button: 2 }));
        context.capturedPointers.length.should.equal(0);
    });
});

describe('when pressing while another camera animation is running', () => {
    it('should cancel that animation', () => {
        context = new a_pointer_gesture_surface();
        context.animationFrameRef.current = 42;
        context.down(context.event({ button: 2 }));
        context.cancelledFrames.should.deep.equal([42]);
        (context.animationFrameRef.current === null).should.equal(true);
    });
});
