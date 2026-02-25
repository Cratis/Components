// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildNavigationBreadcrumbs } from '../breadcrumbHelpers';

describe('when building breadcrumbs with an empty navigation path', () => {
    let result: { name: string; index: number }[];

    beforeEach(() => {
        result = buildNavigationBreadcrumbs([]);
    });

    it('should return only the root item', () => {
        result.should.have.lengthOf(1);
    });

    it('should label the root item as Root', () => {
        result[0].name.should.equal('Root');
    });

    it('should set the root item index to zero', () => {
        result[0].index.should.equal(0);
    });
});
