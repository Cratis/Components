// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, describe, it } from 'vitest';
import { a_pointer_gesture_surface } from './given/a_pointer_gesture_surface';

let context: a_pointer_gesture_surface;

afterEach(() => context.unmount());

const pinchOpen = (surface: a_pointer_gesture_surface) => {
    surface.down(surface.touch(1, 0, 0));
    surface.down(surface.touch(2, 100, 0));
    surface.calls.length = 0;
    surface.move({ pointerType: 'touch', pointerId: 2, clientX: 200, clientY: 0 });
};

describe('when a second finger lands', () => {
    it('should end the one finger drag', () => {
        context = new a_pointer_gesture_surface();
        context.down(context.touch(1, 0, 0));
        context.down(context.touch(2, 100, 0));
        context.container.style.cursor.should.equal('default');
        context.capturedPointers.should.deep.equal([1]);
    });
});

describe('when spreading two fingers', () => {
    it('should zoom around and pan with the midpoint', () => {
        context = new a_pointer_gesture_surface();
        pinchOpen(context);
        context.zoomRef.current.should.equal(2);
        context.panRef.current.should.deep.equal({ x: 20, y: 40 });
        context.calls.should.deep.equal(['noteGestureActivity', 'scheduleTransformApply']);
    });
});

describe('when spreading two fingers past the maximum zoom', () => {
    it('should clamp the zoom', () => {
        context = new a_pointer_gesture_surface({ maxZoom: 1.5 });
        pinchOpen(context);
        context.zoomRef.current.should.equal(1.5);
        context.panRef.current.should.deep.equal({ x: 40, y: 30 });
    });
});

describe('when lifting one of two fingers', () => {
    it('should continue as a one finger drag from the remaining finger', () => {
        context = new a_pointer_gesture_surface();
        pinchOpen(context);
        context.up({ pointerType: 'touch', pointerId: 2 });
        context.container.style.cursor.should.equal('grabbing');
        context.frames.size.should.equal(0);
        context.move({ pointerType: 'touch', pointerId: 1, clientX: 5, clientY: 5 });
        context.panRef.current.should.deep.equal({ x: 25, y: 45 });
    });
});

describe('when moving a finger the surface never saw land', () => {
    it('should not pinch or pan', () => {
        context = new a_pointer_gesture_surface();
        context.move({ pointerType: 'touch', pointerId: 9, clientX: 50, clientY: 50 });
        context.touchPointersRef.current.size.should.equal(0);
        context.panRef.current.should.deep.equal({ x: 10, y: 20 });
    });
});
