// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import { Button } from '../Button';

describe('when rendering the default Button action', () => {
    const html = renderToStaticMarkup(<Button label='Save' />);

    it('should_use_the_primary_base_style_without_a_secondary_severity', () => {
        expect(html).to.contain('data-variant="filled"');
        expect(html).not.to.contain('data-severity=');
    });

    it('should_remain_a_normal_sized_button', () => {
        expect(html).to.contain('data-size="normal"');
    });
});
