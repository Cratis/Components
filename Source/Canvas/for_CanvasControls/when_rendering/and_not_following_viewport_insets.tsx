// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { renderControls } from '../renderControls';

describe('when rendering controls and not following viewport insets', () => {
    const bottomLeft = renderControls({ followViewportInsets: false });
    const bottomRight = renderControls({ placement: 'bottom-right', followViewportInsets: false });

    it('should_sit_at_the_left_edge', () => {
        expect(bottomLeft).to.contain('left:1rem');
    });

    it('should_sit_at_the_right_edge', () => {
        expect(bottomRight).to.contain('right:1rem');
    });

    it('should_not_read_the_insets', () => {
        expect(bottomLeft + bottomRight).not.to.contain('--canvas-viewport-');
    });
});
