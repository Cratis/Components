// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { renderControls } from '../renderControls';

describe('when rendering controls with some replacement icons', () => {
    const html = renderControls({
        icons: { zoomIn: <i data-glyph='sample-plus' aria-hidden='true' /> },
    });

    it('should_render_the_replacement', () => {
        expect(html).to.contain('data-glyph="sample-plus"');
    });

    it('should_keep_the_built_in_icon_for_the_rest', () => {
        expect(html.match(/<svg/g)).to.have.length(1);
    });
});
