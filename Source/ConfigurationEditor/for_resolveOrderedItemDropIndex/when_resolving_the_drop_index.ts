// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { resolveOrderedItemDropIndex } from '../resolveOrderedItemDropIndex';

describe('when resolving the drop index of a dragged item', () => {
    it('should land before the target when moving up and dropped on its leading half', () => {
        expect(resolveOrderedItemDropIndex(3, 1, 'before')).to.equal(1);
    });

    it('should land after the target when moving up and dropped on its trailing half', () => {
        expect(resolveOrderedItemDropIndex(3, 1, 'after')).to.equal(2);
    });

    it('should land before the target when moving down and dropped on its leading half', () => {
        expect(resolveOrderedItemDropIndex(0, 2, 'before')).to.equal(1);
    });

    it('should land after the target when moving down and dropped on its trailing half', () => {
        expect(resolveOrderedItemDropIndex(0, 2, 'after')).to.equal(2);
    });

    it('should not move an item dropped on its own leading half', () => {
        expect(resolveOrderedItemDropIndex(2, 2, 'before')).to.equal(2);
    });

    it('should not move an item dropped on its own trailing half', () => {
        expect(resolveOrderedItemDropIndex(2, 2, 'after')).to.equal(2);
    });
});
