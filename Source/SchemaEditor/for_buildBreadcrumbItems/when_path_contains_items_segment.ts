// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildBreadcrumbItems } from '../schemaHelpers';
import type { NavigationItem } from '../../types/JsonSchema';

describe('when building breadcrumb items with a $items segment', () => {
    let result: NavigationItem[];

    beforeEach(() => {
        result = buildBreadcrumbItems('MyEvent', ['items', '$items']);
    });

    it('should label the $items segment as [items]', () => {
        result[2].name.should.equal('[items]');
    });

    it('should include the $items segment in the path', () => {
        result[2].path.should.deep.equal(['items', '$items']);
    });
});
