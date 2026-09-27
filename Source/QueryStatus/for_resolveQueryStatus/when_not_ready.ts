// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { QueryStatus } from '../QueryStatus';
import { resolveQueryStatus } from '../resolveQueryStatus';

describe('when a query is not ready and no longer performing', () => {
    let status: QueryStatus;

    beforeEach(() => {
        status = resolveQueryStatus({ isReady: false, isPerforming: false });
    });

    it('should remain loading', () => {
        status.should.equal(QueryStatus.Loading);
    });
});
