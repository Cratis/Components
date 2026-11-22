// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it } from 'vitest';
import { a_pointer_gesture_surface } from './given/a_pointer_gesture_surface';

let context: a_pointer_gesture_surface;

afterEach(() => context.unmount());

describe('when dragging with one finger and the host claims background drags', () => {
    it('should still pan', () => {
        context = new a_pointer_gesture_surface({ backgroundDragPans: false });
        context.down(context.touch(3, 0, 0));
        context.capturedPointers.should.deep.equal([3]);
        context.touchPointersRef.current.get(3)!.should.deep.equal({ x: 0, y: 0 });
    });
});

describe('when releasing a fast one finger drag', () => {
    beforeEach(() => {
        context = new a_pointer_gesture_surface();
        context.down(context.touch(1, 0, 0));
        context.now = 10;
        context.move({ pointerType: 'touch', pointerId: 1, clientX: 10, clientY: 0 });
        context.calls.length = 0;
        context.up({ pointerType: 'touch', pointerId: 1 });
    });

    it('should forget the finger and restore the cursor', () => {
        context.touchPointersRef.current.size.should.equal(0);
        context.container.style.cursor.should.equal('default');
    });

    it('should coast the board by the release velocity', () => {
        context.panRef.current.should.deep.equal({ x: 20, y: 20 });
        context.runFrame(26);
        context.panRef.current.should.deep.equal({ x: 36, y: 20 });
        context.calls.should.deep.equal(['applyWorldTransform', 'refreshMinimap', 'render', 'noteGestureActivity']);
        context.frames.size.should.equal(1);
        (context.animationFrameRef.current !== null).should.equal(true);
    });

    it('should stop coasting once the velocity has decayed', () => {
        let frames = 0;
        let time = 10;
        while (context.frames.size > 0 && frames < 1000) {
            time += 16;
            context.runFrame(time);
            frames++;
        }
        frames.should.equal(70);
        (context.animationFrameRef.current === null).should.equal(true);
    });
});

describe('when releasing a slow one finger drag', () => {
    it('should not coast', () => {
        context = new a_pointer_gesture_surface();
        context.down(context.touch(1, 0, 0));
        context.now = 90;
        context.move({ pointerType: 'touch', pointerId: 1, clientX: 1, clientY: 0 });
        context.up({ pointerType: 'touch', pointerId: 1 });
        context.frames.size.should.equal(0);
    });
});

describe('when releasing a one finger drag whose early samples fell outside the window', () => {
    it('should read the velocity from the trailing samples only', () => {
        context = new a_pointer_gesture_surface();
        context.down(context.touch(1, 0, 0));
        context.now = 50;
        context.move({ pointerType: 'touch', pointerId: 1, clientX: 100, clientY: 0 });
        context.now = 200;
        context.move({ pointerType: 'touch', pointerId: 1, clientX: 101, clientY: 0 });
        context.up({ pointerType: 'touch', pointerId: 1 });
        context.frames.size.should.equal(0);
    });
});
