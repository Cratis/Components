// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildBreadcrumbItems } from '../schemaHelpers';
import type { NavigationItem } from '../../types/JsonSchema';

describe('when building breadcrumb items with a regular path', () => {
    let result: NavigationItem[];

    beforeEach(() => {
        result = buildBreadcrumbItems('MyEvent', ['address', 'city']);
    });

    it('should include the root plus one item per path segment', () => {
        result.should.have.lengthOf(3);
    });

    it('should label each item with its path segment name', () => {
        result[1].name.should.equal('address');
        result[2].name.should.equal('city');
    });

    it('should set the path of each item to the slice up to that segment', () => {
        result[1].path.should.deep.equal(['address']);
        result[2].path.should.deep.equal(['address', 'city']);
    });
});
