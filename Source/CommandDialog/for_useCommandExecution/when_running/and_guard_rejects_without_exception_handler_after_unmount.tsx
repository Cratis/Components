// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import * as submission from '../given/a_submission';

describe('when a guard rejects after unmount without an exception handler', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    beforeEach(async () => {
        consoleError.mockClear();
        let rejectGuard!: (error: Error) => void;
        const pending = new Promise<boolean>((_resolve, reject) => { rejectGuard = reject; });
        await submission.mount({ guard: () => pending, reportException: false });
        await act(async () => { void submission.run(); });
        await submission.unmount();
        await act(async () => rejectGuard(new Error('Example failure')));
    });
    afterEach(() => consoleError.mockClear());
    it('should report the exception to the console', () => { (consoleError.mock.calls[0][0] as Error).message.should.equal('Example failure'); });
    it('should not execute', () => { submission.execute.mock.calls.length.should.equal(0); });
});
