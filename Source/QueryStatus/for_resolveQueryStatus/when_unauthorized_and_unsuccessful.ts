// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { QueryStatus } from '../QueryStatus';
import { resolveQueryStatus } from '../resolveQueryStatus';

describe('when a settled query is unauthorized and unsuccessful', () => {
    let status: QueryStatus;

    beforeEach(() => {
        status = resolveQueryStatus({ isSuccess: false, isAuthorized: false, isPerforming: false, isReady: true });
    });

    it('should prioritize unauthorized', () => {
        status.should.equal(QueryStatus.Unauthorized);
    });
});
