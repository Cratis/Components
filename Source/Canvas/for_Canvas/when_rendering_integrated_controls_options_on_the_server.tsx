// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import { Canvas } from '../Canvas';

describe('when rendering integrated controls options on the server', () => {
    const html = renderToStaticMarkup(
        <Canvas
            controlsIcons={{ zoomIn: <i data-glyph='sample-plus' aria-hidden='true' /> }}
            controlsFollowViewportInsets={false}
        />,
    );

    it('should_forward_the_icons', () => {
        expect(html).to.contain('data-glyph="sample-plus"');
    });

    it('should_forward_the_viewport_inset_choice', () => {
        expect(html).not.to.contain('--canvas-viewport-');
    });
});
