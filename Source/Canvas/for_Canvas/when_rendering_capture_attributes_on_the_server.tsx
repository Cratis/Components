// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import { Canvas } from '../Canvas';

describe('when rendering Canvas capture attributes on the server', () => {
    const html = renderToStaticMarkup(
        <Canvas
            captureAttributes={{
                content: 'data-product-compositor-content',
                layer: 'data-product-compositor-layer',
                transformHost: 'data-product-compositor-transform-host',
            }}
            controlsGlassSurface={<span>Product compositor surface</span>}
        >
            <button type='button'>Canvas content</button>
        </Canvas>,
    );

    it('should_mark_both_transform_hosts', () => {
        expect(html.match(/data-product-compositor-transform-host="true"/g)).to.have.length(2);
    });

    it('should_mark_non_plain_control_content', () => {
        expect(html).to.contain('data-product-compositor-content="true"');
    });

    it('should_not_hardcode_a_capture_provider', () => {
        const defaultHtml = renderToStaticMarkup(<Canvas showControls={false} />);
        expect(defaultHtml).not.to.contain('data-product-compositor-');
    });
});
