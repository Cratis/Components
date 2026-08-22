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
    };

    it('should provide the adapter-independent runtime value', () => {
        expect(filters.name.matchMode).to.equal('contains');
    });
});
