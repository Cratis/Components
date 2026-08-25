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
            value: 'Morgan',
            matchMode: DataTableFilterMatchMode.Contains,
        },
        legacyCustomField: {
            value: 'Grace',
            matchMode: 'matcherRegisteredByTheConsumer',
        },
    };

    const matchModeFor = (field: string) => {
        const entry = filters[field];
        if ('constraints' in entry) {
            throw new Error(`${field} unexpectedly uses operator constraints.`);
        }
        return entry.matchMode;
    };

    it('should provide the adapter-independent runtime value', () => {
        expect(matchModeFor('name')).to.equal('contains');
    });

    it('should retain source compatibility with existing custom matcher names', () => {
        expect(matchModeFor('legacyCustomField')).to.equal(
            'matcherRegisteredByTheConsumer',
        );
    });
});
