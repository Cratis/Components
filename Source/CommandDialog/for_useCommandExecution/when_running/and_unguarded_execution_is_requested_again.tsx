// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import * as submission from '../given/a_submission';

describe('when an unguarded execution is requested twice while pending', () => {
    let resolveExecution!: (result: typeof submission.success) => void;
    beforeEach(async () => {
        await submission.mount();
        submission.execute.mockImplementation(() => new Promise(resolve => { resolveExecution = resolve; }));
        await act(async () => { void submission.run(); void submission.run(); });
        await act(async () => resolveExecution(submission.success));
    });
    afterEach(submission.unmount);
    it('should execute twice as it did without confirmation', () => { submission.execute.mock.calls.length.should.equal(2); });
});
