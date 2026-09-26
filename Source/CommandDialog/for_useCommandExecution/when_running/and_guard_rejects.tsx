// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import * as submission from '../given/a_submission';

describe('when a guard rejects asynchronously', () => {
    let rejectGuard!: (error: Error) => void;
    beforeEach(async () => {
        const pending = new Promise<boolean>((_resolve, reject) => { rejectGuard = reject; });
        await submission.mount({ guard: () => pending });
        await act(async () => { void submission.run(); });
        await act(async () => rejectGuard(new Error('Example guard failure')));
    });
    afterEach(submission.unmount);
    it('should report the exception', () => { submission.onException.mock.calls[0][0].should.deep.equal(['Example guard failure']); });
    it('should release busy', () => { submission.isBusy.should.equal(false); });
    it('should not execute', () => { submission.execute.mock.calls.length.should.equal(0); });
});
