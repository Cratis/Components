// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import { Surface } from '../Surface';
import {
    mountPrimitive,
    unmountPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

describe('when using the semantic Surface contract', () => {
    it('should render the bounded semantic element and forward a real HTMLElement ref', async () => {
        const ref = createRef<HTMLElement>();
        const mounted = await mountPrimitive(
            <Surface
                as='section'
                ref={ref}
                aria-label='Summary'
                pt={{ root: { 'data-testid': 'summary-surface' } }}
            >
                Content
            </Surface>,
        );
        try {
            expect(ref.current).to.be.instanceOf(HTMLElement);
            expect(ref.current?.tagName).to.equal('SECTION');
            expect(ref.current?.getAttribute('data-testid')).to.equal('summary-surface');
            expect(ref.current?.hasAttribute('data-selected')).to.equal(false);
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should render a stable state-free root during SSR', () => {
        const html = renderToStaticMarkup(
            <Surface as='article' aria-label='Example article'>
                Example content
            </Surface>,
        );
        expect(html).to.contain('<article');
        expect(html).to.contain('data-cratis-part="root"');
        expect(html).to.contain('aria-label="Example article"');
        expect(html).not.to.contain('data-selected=');
        expect(html).not.to.contain('role=');
    });
});
