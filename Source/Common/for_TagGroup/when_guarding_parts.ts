// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { cratisPartStates, cratisParts } from '../../types/parts';

describe('when guarding TagGroup parts', () => {
    it('should keep the exact public part inventory', () => {
        expect(cratisParts.TagGroup).to.deep.equal([
            'root',
            'list',
            'tag',
            'remove',
            'input',
        ]);
    });

    it('should keep the exact state contract of every part', () => {
        expect(cratisPartStates.TagGroup).to.deep.equal({
            root: ['disabled', 'invalid'],
            list: [],
            tag: ['disabled'],
            remove: [],
            input: ['invalid'],
        });
    });
});
