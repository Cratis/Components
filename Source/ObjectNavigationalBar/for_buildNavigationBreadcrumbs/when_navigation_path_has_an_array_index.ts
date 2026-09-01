// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildNavigationBreadcrumbs } from '../breadcrumbHelpers';

describe('when building breadcrumbs with an array index in the navigation path', () => {
    let result: { name: string; index: number }[];

    beforeEach(() => {
        result = buildNavigationBreadcrumbs(['causation', '0', 'properties']);
    });

    it('should render the index segment in bracket notation', () => {
        result[2].name.should.equal('[0]');
    });

    it('should leave property segments unchanged', () => {
        result[1].name.should.equal('causation');
        result[3].name.should.equal('properties');
    });
});
