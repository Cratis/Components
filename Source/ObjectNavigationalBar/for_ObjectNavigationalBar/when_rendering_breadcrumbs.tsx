// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { ObjectNavigationalBar } from '../ObjectNavigationalBar';

describe('when rendering breadcrumbs', () => {
    const html = renderToStaticMarkup(
        <ObjectNavigationalBar
            navigationPath={['person', 'address']}
            onNavigate={() => undefined}
        />,
    );

    it('should render every location as a native keyboard button', () => {
        expect(html.match(/<button/g)).to.have.lengthOf(4);
        expect(html).to.contain('person');
        expect(html).to.contain('address');
    });

    it('should identify the current location', () => {
        expect(html).to.contain('aria-current="location"');
    });
});
