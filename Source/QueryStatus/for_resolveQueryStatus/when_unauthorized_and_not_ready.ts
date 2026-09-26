// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { QueryStatus } from '../QueryStatus';
import { resolveQueryStatus } from '../resolveQueryStatus';

describe('when unauthorized and not ready', () => {
    let status: QueryStatus;

    beforeEach(() => {
        status = resolveQueryStatus({ isAuthorized: false, isReady: false });
    });

    it('should prioritize unauthorized', () => {
        status.should.equal(QueryStatus.Unauthorized);
    });
});
