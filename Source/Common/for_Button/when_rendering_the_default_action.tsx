// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { Button } from '../Button';

describe('when rendering the default Button action', () => {
    const html = renderToStaticMarkup(<Button label='Save' />);

    it('should use the solid primary treatment', () => {
        expect(html).to.contain('data-variant="solid"');
        expect(html).to.contain('data-shape="default"');
        expect(html).not.to.contain('data-tone=');
        expect(html).not.to.contain('data-severity=');
    });

    it('should use the normal size', () => {
        expect(html).to.contain('data-size="normal"');
    });

    it('should remain enabled and idle', () => {
        expect(html).not.to.contain(' disabled=');
        expect(html).not.to.contain('data-disabled=');
        expect(html).not.to.contain('data-loading=');
    });

    it('should default the native button type', () => {
        expect(html).to.contain('type="button"');
    });
});
