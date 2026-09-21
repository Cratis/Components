// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { cratisPartStates, cratisParts } from '../../types/parts';

describe('when guarding Tabs parts', () => {
    it('should keep the exact public part inventory', () => {
        expect(cratisParts.Tabs).to.deep.equal([
            'root',
            'list',
            'tab',
            'panel',
        ]);
    });

    it('should keep the exact state contract of every part', () => {
        expect(cratisPartStates.Tabs).to.deep.equal({
            root: ['disabled'],
            list: [],
            tab: ['selected', 'disabled'],
            panel: ['selected'],
        });
    });
});
