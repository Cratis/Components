// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { DataTableStatus } from '../DataTableStatus';
import { resolveDataTableStatus } from '../resolveDataTableStatus';

describe('when an authorized query has exceptions while performing', () => {
    let status: DataTableStatus;

    beforeEach(() => {
        status = resolveDataTableStatus({ isAuthorized: true, hasExceptions: true, isValid: false, isPerforming: true });
    });

    it('should prioritize failure over loading', () => {
        status.should.equal(DataTableStatus.Failed);
    });
});
