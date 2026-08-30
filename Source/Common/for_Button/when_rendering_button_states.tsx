// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { Button } from '../Button';

describe('when rendering Button states', () => {
    it('should expose the disabled state', () => {
        const html = renderToStaticMarkup(<Button label='Action' disabled />);

        expect(html).to.contain('disabled=""');
        expect(html).to.contain('data-disabled="true"');
        expect(html).not.to.contain('data-loading=');
    });

    it('should expose loading as busy and disabled', () => {
        const html = renderToStaticMarkup(<Button label='Action' loading />);

        expect(html).to.contain('disabled=""');
        expect(html).to.contain('aria-busy="true"');
        expect(html).to.contain('data-disabled="true"');
        expect(html).to.contain('data-loading="true"');
        expect(html).to.contain('data-cratis-part="spinner"');
    });
});
