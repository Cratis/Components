// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { beforeEach, describe, it } from 'vitest';
import * as submission from '../given/a_submission';

describe('when a guard rejects after unmount', () => {
    beforeEach(async () => {
        let rejectGuard!: (error: Error) => void;
        const pending = new Promise<boolean>((_resolve, reject) => { rejectGuard = reject; });
        await submission.mount({ guard: () => pending });
        await act(async () => { void submission.run(); });
        await submission.unmount();
        await act(async () => rejectGuard(new Error('Example failure')));
    });
    it('should report to onException', () => { submission.onException.mock.calls[0][0].should.deep.equal(['Example failure']); });
    it('should not execute', () => { submission.execute.mock.calls.length.should.equal(0); });
});
