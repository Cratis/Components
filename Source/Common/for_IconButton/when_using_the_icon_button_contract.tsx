// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act } from 'react';
import { expect } from 'chai';
import { describe, it, vi } from 'vitest';
import { IconButton } from '../IconButton';
import {
    mountPrimitive,
    unmountPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

describe('when using the IconButton contract', () => {
    it('should forward the real button ref and keep Button as the only interaction owner', async () => {
        const ref = createRef<HTMLButtonElement>();
        const onClick = vi.fn();
        const mounted = await mountPrimitive(
            <IconButton
                ref={ref}
                icon={<span>+</span>}
                aria-label='Add item'
                onClick={onClick}
                pt={{ root: { 'data-testid': 'icon-action' } }}
            />,
        );
        try {
            expect(ref.current).to.be.instanceOf(HTMLButtonElement);
            expect(ref.current?.getAttribute('data-testid')).to.equal('icon-action');
            expect(ref.current?.getAttribute('data-shape')).to.equal('pill');
            expect(mounted.container.querySelectorAll('button')).to.have.lengthOf(1);
            await act(async () => ref.current?.click());
            expect(onClick.mock.calls).to.have.lengthOf(1);
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should preserve semantic Button loading, disabled, tone, and part states during SSR', () => {
        const html = renderToStaticMarkup(
            <IconButton
                icon={<span>!</span>}
                aria-label='Stop operation'
                loading
                tone='critical'
                variant='outline'
            />,
        );

        expect(html).to.contain('aria-label="Stop operation"');
        expect(html).to.contain('data-loading="true"');
        expect(html).to.contain('data-disabled="true"');
        expect(html).to.contain('data-tone="critical"');
        expect(html).to.contain('data-variant="outline"');
        expect(html).to.contain('data-cratis-part="spinner"');
    });
});
