// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { PivotViewer } from '../PivotViewer';

interface Product {
    id: number;
    name: string;
}

describe('when rendering PivotViewer on the server', () => {
    const render = (colors?: { surfaceCard?: string; surfaceSection?: string }) =>
        renderToStaticMarkup(
            <PivotViewer<Product>
                data={[]}
                dimensions={[]}
                cardRenderer={(product) => ({ title: product.name })}
                colors={colors}
            />,
        );

    it('should_render_without_browser_globals', () => {
        expect(render()).to.contain('pivot-viewer');
    });

    it('should_map_public_card_colors_to_semantic_tokens', () => {
        const html = render({ surfaceCard: '#112233', surfaceSection: '#223344' });

        expect(html).to.contain('--cratis-surface-card:#112233');
        expect(html).to.contain('--cratis-surface-section:#223344');
    });
});
