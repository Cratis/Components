// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import {
    DataTableFilterMatchMode,
    type DataTableFilterMeta,
} from '../DataTableFilterMeta';

describe('when using built-in match modes', () => {
    const filters: DataTableFilterMeta = {
        name: {
            value: 'Ada',
            matchMode: DataTableFilterMatchMode.Contains,
        },
        legacyCustomField: {
            value: 'Grace',
            matchMode: 'matcherRegisteredByTheConsumer',
        },
    };

    it('should provide the adapter-independent runtime value', () => {
        expect(filters.name.matchMode).to.equal('contains');
    });

    it('should retain source compatibility with existing custom matcher names', () => {
        expect(filters.legacyCustomField.matchMode).to.equal(
            'matcherRegisteredByTheConsumer',
        );
    });
});
