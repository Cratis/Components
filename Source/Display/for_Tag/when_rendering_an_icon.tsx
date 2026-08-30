// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { Tag } from '../Tag';

describe('when rendering a Tag icon', () => {
    it('should treat a string as a consumer-owned icon class', () => {
        const html = renderToStaticMarkup(
            <Tag value='Member' severity='success' icon='product-icons product-user' />,
        );

        expect(html).to.contain('<i class="product-icons product-user"></i>');
        expect(html).not.to.contain('product-icons product-userMember');
    });

    it('should render a supplied React node unchanged', () => {
        const html = renderToStaticMarkup(
            <Tag
                value='Member'
                severity='success'
                icon={<svg data-testid='member-icon' />}
            />,
        );

        expect(html).to.contain('<svg data-testid="member-icon"></svg>');
    });
});
