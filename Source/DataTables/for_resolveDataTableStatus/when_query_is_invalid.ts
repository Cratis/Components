// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { DataTableStatus } from '../DataTableStatus';
import { resolveDataTableStatus } from '../resolveDataTableStatus';

describe('when a query is invalid without exceptions', () => {
    let status: DataTableStatus;

    beforeEach(() => {
        status = resolveDataTableStatus({ hasExceptions: false, isValid: false, isPerforming: true });
    });

    it('should show failure over loading', () => {
        status.should.equal(DataTableStatus.Failed);
    });
});
