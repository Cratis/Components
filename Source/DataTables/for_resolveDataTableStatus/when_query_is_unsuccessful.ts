// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { DataTableStatus } from '../DataTableStatus';
import { resolveDataTableStatus } from '../resolveDataTableStatus';

describe('when a settled query is unsuccessful without exceptions or validation errors', () => {
    let status: DataTableStatus;

    beforeEach(() => {
        status = resolveDataTableStatus({ isSuccess: false, isAuthorized: true, hasExceptions: false, isValid: true, isPerforming: false, isReady: true });
    });

    it('should show failure rather than an empty table', () => {
        status.should.equal(DataTableStatus.Failed);
    });
});
