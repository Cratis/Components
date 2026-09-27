// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { QueryStatus } from '../QueryStatus';
import { resolveQueryStatus } from '../resolveQueryStatus';

describe('when readiness is absent from an older query result', () => {
    let status: QueryStatus;

    beforeEach(() => {
        status = resolveQueryStatus({ isReady: undefined, isPerforming: false });
    });

    it('should remain ready', () => {
        status.should.equal(QueryStatus.Ready);
    });
});
