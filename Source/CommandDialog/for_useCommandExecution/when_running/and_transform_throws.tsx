// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import * as submission from '../given/a_submission';

describe('when a transform throws synchronously', () => {
    let error: unknown;
    beforeEach(async () => {
        await submission.mount({ transform: () => { throw new Error('Example transform failure'); } });
        await act(async () => { try { await submission.run(); } catch (caught) { error = caught; } });
    });
    afterEach(submission.unmount);
    it('should release busy', () => { submission.isBusy.should.equal(false); });
    it('should propagate the error', () => { (error as Error).message.should.equal('Example transform failure'); });
    it('should not execute', () => { submission.execute.mock.calls.length.should.equal(0); });
});
