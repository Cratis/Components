// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import * as submission from '../given/a_submission';

describe('when submitting again while the guard is pending', () => {
    let resolveGuard!: (approved: boolean) => void;
    let secondResult: unknown;
    beforeEach(async () => {
        const pending = new Promise<boolean>(resolve => { resolveGuard = resolve; });
        await submission.mount({ guard: () => pending });
        await act(async () => { void submission.run(); });
        await act(async () => { secondResult = await submission.run(); });
        await act(async () => resolveGuard(true));
    });
    afterEach(submission.unmount);
    it('should reject the re-entry', () => { (secondResult === undefined).should.equal(true); });
    it('should execute once', () => { submission.execute.mock.calls.length.should.equal(1); });
});
