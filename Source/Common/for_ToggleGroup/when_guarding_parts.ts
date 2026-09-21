// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { cratisPartStates, cratisParts } from '../../types/parts';

describe('when guarding ToggleGroup parts', () => {
    it('should keep the exact public part inventory', () => {
        expect(cratisParts.ToggleGroup).to.deep.equal([
            'root',
            'option',
            'icon',
            'label',
        ]);
    });

    it('should keep the exact state contract of every part', () => {
        expect(cratisPartStates.ToggleGroup).to.deep.equal({
            root: ['disabled', 'invalid'],
            option: ['selected', 'disabled', 'invalid'],
            icon: [],
            label: [],
        });
    });
});
