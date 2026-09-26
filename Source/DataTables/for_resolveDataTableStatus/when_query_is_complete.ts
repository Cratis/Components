// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { DataTableStatus } from '../DataTableStatus';
import { resolveDataTableStatus } from '../resolveDataTableStatus';

describe('when a query completes successfully', () => {
    let status: DataTableStatus;

    beforeEach(() => {
        status = resolveDataTableStatus({ isAuthorized: true, hasExceptions: false, isValid: true, isPerforming: false });
    });

    it('should be ready', () => {
        status.should.equal(DataTableStatus.Ready);
    });
});
