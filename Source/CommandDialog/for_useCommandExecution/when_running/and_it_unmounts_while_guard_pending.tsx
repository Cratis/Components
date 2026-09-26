// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { beforeEach, describe, it } from 'vitest';
import * as submission from '../given/a_submission';

describe('when unmounting while the guard is pending', () => {
    let resolveGuard!: (approved: boolean) => void;
    beforeEach(async () => {
        const pending = new Promise<boolean>(resolve => { resolveGuard = resolve; });
        await submission.mount({ guard: () => pending });
        await act(async () => { void submission.run(); });
        await submission.unmount();
        await act(async () => resolveGuard(true));
    });
    it('should not execute', () => { submission.execute.mock.calls.length.should.equal(0); });
});
