// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildNavigationBreadcrumbs } from '../breadcrumbHelpers';

describe('when building breadcrumbs with a navigation path', () => {
    let result: { name: string; index: number }[];

    beforeEach(() => {
        result = buildNavigationBreadcrumbs(['address', 'city']);
    });

    it('should include the root plus one item per path segment', () => {
        result.should.have.lengthOf(3);
    });

    it('should label each item with its path segment name', () => {
        result[1].name.should.equal('address');
        result[2].name.should.equal('city');
    });

    it('should assign sequential indices starting after root', () => {
        result[1].index.should.equal(1);
        result[2].index.should.equal(2);
    });
});
