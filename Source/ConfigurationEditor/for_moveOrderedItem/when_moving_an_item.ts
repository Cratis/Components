// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { moveOrderedItem } from '../moveOrderedItem';

describe('when moving an item in a collection', () => {
    const items = ['a', 'b', 'c', 'd'];

    it('should move an item towards the end', () => {
        expect(moveOrderedItem(items, 0, 2)).to.deep.equal(['b', 'c', 'a', 'd']);
    });

    it('should move an item towards the start', () => {
        expect(moveOrderedItem(items, 3, 1)).to.deep.equal(['a', 'd', 'b', 'c']);
    });

    it('should leave the input untouched', () => {
        moveOrderedItem(items, 0, 3);

        expect(items).to.deep.equal(['a', 'b', 'c', 'd']);
    });
});
