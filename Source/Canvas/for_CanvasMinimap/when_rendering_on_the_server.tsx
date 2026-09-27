// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import { CanvasMinimap } from '../CanvasMinimap';

describe('when rendering the minimap on the server', () => {
    const html = renderToStaticMarkup(
        <CanvasMinimap
            items={[
                { x: 0, y: 0, width: 400, height: 300 },
                { x: 800, y: 600, width: 400, height: 300, color: 'rgb(1, 2, 3)' },
            ]}
        />,
    );

    it('should_draw_the_grid_from_the_grid_token_falling_back_to_the_surface_border', () => {
        expect(html).to.contain(
            'var(--cratis-canvas-minimap-grid-color, var(--cratis-surface-border))',
        );
    });

    it('should_draw_an_uncolored_item_from_the_item_token_falling_back_to_the_text_color', () => {
        expect(html).to.contain(
            'var(--cratis-canvas-minimap-item-color, color-mix(in srgb, var(--cratis-text-color) 25%, transparent))',
        );
    });

    it('should_keep_an_items_own_color', () => {
        expect(html).to.contain('background:rgb(1, 2, 3)');
    });
});
