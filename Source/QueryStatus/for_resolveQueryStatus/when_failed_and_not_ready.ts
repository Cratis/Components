// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { QueryStatus } from '../QueryStatus';
import { resolveQueryStatus } from '../resolveQueryStatus';

describe('when a query fails before it is ready', () => {
    let status: QueryStatus;

    beforeEach(() => {
        status = resolveQueryStatus({ hasExceptions: true, isValid: false, isReady: false });
    });

    it('should prioritize failure', () => {
        status.should.equal(QueryStatus.Failed);
    });
});
