// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { renderControls } from '../renderControls';

describe('when rendering controls with replacement icons', () => {
    const html = renderControls({
        showMinimapToggle: true,
        onHelp: () => undefined,
        icons: {
            toggleMinimap: <i data-glyph='sample-map' aria-hidden='true' />,
            zoomOut: <i data-glyph='sample-minus' aria-hidden='true' />,
            zoomIn: <i data-glyph='sample-plus' aria-hidden='true' />,
            help: <i data-glyph='sample-help' aria-hidden='true' />,
        },
    });

    it('should_render_every_replacement', () => {
        ['sample-map', 'sample-minus', 'sample-plus', 'sample-help'].forEach((glyph) =>
            expect(html).to.contain(`data-glyph="${glyph}"`),
        );
    });

    it('should_not_render_the_built_in_icons', () => {
        expect(html).not.to.contain('<svg');
    });

    it('should_keep_the_accessible_names', () => {
        ['Toggle minimap', 'Zoom Out', 'Zoom In', 'Help'].forEach((name) =>
            expect(html).to.contain(`aria-label="${name}"`),
        );
    });
});
