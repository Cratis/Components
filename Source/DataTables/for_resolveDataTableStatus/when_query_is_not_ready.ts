// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { DataTableStatus } from '../DataTableStatus';
import { resolveDataTableStatus } from '../resolveDataTableStatus';

describe('when a query result is not ready and no longer performing', () => {
    let status: DataTableStatus;

    beforeEach(() => {
        status = resolveDataTableStatus({ isReady: false, isPerforming: false });
    });

    it('should select loading for the table', () => {
        status.should.equal(DataTableStatus.Loading);
    });
});
