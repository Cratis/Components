// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { QueryStatus } from '../QueryStatus';
import { resolveQueryStatus } from '../resolveQueryStatus';

describe('when a settled query is unsuccessful without exceptions or validation errors', () => {
    let status: QueryStatus;

    beforeEach(() => {
        status = resolveQueryStatus({
            isSuccess: false,
            isAuthorized: true,
            hasExceptions: false,
            isValid: true,
            isPerforming: false,
            isReady: true,
        });
    });

    it('should be failed', () => {
        status.should.equal(QueryStatus.Failed);
    });
});
