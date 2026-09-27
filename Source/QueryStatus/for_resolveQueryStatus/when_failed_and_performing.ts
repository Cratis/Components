// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { QueryStatus } from '../QueryStatus';
import { resolveQueryStatus } from '../resolveQueryStatus';

describe('when an authorized query has exceptions while performing', () => {
    let status: QueryStatus;

    beforeEach(() => {
        status = resolveQueryStatus({ isAuthorized: true, hasExceptions: true, isValid: false, isPerforming: true });
    });

    it('should prioritize failure over loading', () => {
        status.should.equal(QueryStatus.Failed);
    });
});
