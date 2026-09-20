// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { cratisPartStates, cratisParts } from '../../types/parts';

describe('when guarding Breadcrumbs parts', () => {
    it('should keep the exact public part inventory', () => {
        expect(cratisParts.Breadcrumbs).to.deep.equal([
            'root',
            'item',
            'link',
            'separator',
        ]);
    });

    it('should keep the exact state contract of every part', () => {
        expect(cratisPartStates.Breadcrumbs).to.deep.equal({
            root: [],
            item: ['selected'],
            link: ['selected'],
            separator: [],
        });
    });
});
