// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildBreadcrumbItems } from '../schemaHelpers';
import type { NavigationItem } from '../../types/JsonSchema';

describe('when building breadcrumb items with an empty path', () => {
    let result: NavigationItem[];

    beforeEach(() => {
        result = buildBreadcrumbItems('MyEvent', []);
    });

    it('should return only the root item', () => {
        result.should.have.lengthOf(1);
    });

    it('should use the event type name as the root label', () => {
        result[0].name.should.equal('MyEvent');
    });

    it('should set the root item path to an empty array', () => {
        result[0].path.should.deep.equal([]);
    });
});
