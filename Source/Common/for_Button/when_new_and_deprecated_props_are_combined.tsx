// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, it, vi } from 'vitest';
import { Button } from '../Button';

describe('when new and deprecated Button props are combined', () => {
    let html: string;

    beforeAll(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        html = renderToStaticMarkup(
            <Button
                label='Action'
                variant='ghost'
                tone='positive'
                shape='default'
                text
                link
                outlined
                rounded
                severity='help'
            />,
        );
    });

    afterAll(() => vi.restoreAllMocks());

    it('should prefer the new variant', () => {
        expect(html).to.contain('data-variant="ghost"');
    });

    it('should prefer the new tone and emit its matching legacy severity', () => {
        expect(html).to.contain('data-tone="positive"');
        expect(html).to.contain('data-severity="success"');
        expect(html).not.to.contain('data-severity="help"');
    });

    it('should prefer the new shape', () => {
        expect(html).to.contain('data-shape="default"');
    });
});
