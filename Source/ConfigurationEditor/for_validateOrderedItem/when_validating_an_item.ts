// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { defaultOrderedItemLabels } from '../defaultOrderedItemLabels';
import type { OrderedItemCapabilities } from '../OrderedItemCapabilities';
import { hasOrderedItemValidation, validateOrderedItem } from '../validateOrderedItem';

const editableLabel: OrderedItemCapabilities = { add: true, remove: true, reorder: true, fields: { label: 'editable' } };
const readonlyLabel: OrderedItemCapabilities = { add: true, remove: true, reorder: true, fields: { label: 'readonly' } };

describe('when validating an ordered item', () => {
    it('should require a label when the label is editable', () => {
        const messages = validateOrderedItem({ id: 'page-a', label: '   ' }, [], editableLabel, defaultOrderedItemLabels);

        expect(messages.label).to.equal(defaultOrderedItemLabels.labelRequired);
    });

    it('should not require a label the host does not let anyone edit', () => {
        const messages = validateOrderedItem({ id: 'page-a', label: '' }, [], readonlyLabel, defaultOrderedItemLabels);

        expect(hasOrderedItemValidation(messages)).to.equal(false);
    });

    it('should include the host rules', () => {
        const messages = validateOrderedItem(
            { id: 'page-a', label: 'Page A' },
            [{ id: 'page-a', label: 'Page A' }],
            editableLabel,
            defaultOrderedItemLabels,
            () => ({ item: 'Not allowed here' }),
        );

        expect(messages.item).to.equal('Not allowed here');
    });

    it('should let its own message win over a host message for the same field', () => {
        const messages = validateOrderedItem(
            { id: 'page-a', label: '' },
            [],
            editableLabel,
            defaultOrderedItemLabels,
            () => ({ label: 'Host says no' }),
        );

        expect(messages.label).to.equal(defaultOrderedItemLabels.labelRequired);
    });

    it('should ignore empty host messages', () => {
        const messages = validateOrderedItem({ id: 'page-a', label: 'A' }, [], editableLabel, defaultOrderedItemLabels, () => ({ label: '' }));

        expect(hasOrderedItemValidation(messages)).to.equal(false);
    });
});
