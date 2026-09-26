// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { DataTableStatus } from '../DataTableStatus';
import { resolveDataTableStatus } from '../resolveDataTableStatus';

describe('when query state flags are missing', () => {
    let status: DataTableStatus;

    beforeEach(() => {
        status = resolveDataTableStatus({});
    });

    it('should default to ready', () => {
        status.should.equal(DataTableStatus.Ready);
    });
});
