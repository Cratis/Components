// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { renderControls } from '../renderControls';

describe('when rendering controls and following viewport insets', () => {
    const bottomLeft = renderControls();
    const bottomRight = renderControls({ placement: 'bottom-right' });

    it('should_step_aside_by_the_left_inset', () => {
        expect(bottomLeft).to.contain('left:calc(1rem + var(--canvas-viewport-left, 0px))');
    });

    it('should_step_aside_by_the_right_inset', () => {
        expect(bottomRight).to.contain('right:calc(1rem + var(--canvas-viewport-right, 0px))');
    });
});
