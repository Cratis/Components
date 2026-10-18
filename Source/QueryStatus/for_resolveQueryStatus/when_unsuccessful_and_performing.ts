// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { QueryStatus } from '../QueryStatus';
import { resolveQueryStatus } from '../resolveQueryStatus';

describe('when an unsuccessful result is performed again', () => {
    let status: QueryStatus;

    beforeEach(() => {
        status = resolveQueryStatus({ isSuccess: false, isAuthorized: true, hasExceptions: false, isValid: true, isPerforming: true });
    });

    it('should be loading until the new attempt settles', () => {
        status.should.equal(QueryStatus.Loading);
    });
});
