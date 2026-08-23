// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { describe, it } from 'vitest';
import { isBackgroundPointerTarget } from '../isBackgroundPointerTarget';

const container = {} as EventTarget;
const dragHandle = {} as EventTarget;
const canvasElement = { tagName: 'CANVAS' } as unknown as EventTarget;

describe('when deciding whether a pointer target is background', () => {
    it('should treat a touch on an unclaimed element as background', () => {
        isBackgroundPointerTarget('touch', false, dragHandle, container).should.be.true;
    });

    it('should treat every read-only pointer as background regardless of pointer type', () => {
        isBackgroundPointerTarget('mouse', true, dragHandle, container).should.be.true;
    });

    it('should treat a mouse on the bare container as background', () => {
        isBackgroundPointerTarget('mouse', false, container, container).should.be.true;
    });

    it('should treat a mouse on the rendering canvas as background', () => {
        isBackgroundPointerTarget('mouse', false, canvasElement, container).should.be.true;
    });

    it('should not treat a mouse on an unrelated element as background', () => {
        isBackgroundPointerTarget('mouse', false, dragHandle, container).should.be.false;
    });
});
