// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { vi } from 'vitest';
import { execution, render, submit, unmount } from '../given/an_inline_stepper_in_the_dom';

describe('when inline stepper execution fails after unmount without a guard', () => {
    const onFailed = vi.fn();
    beforeEach(async () => {
        execution.result.isSuccess = false;
        onFailed.mockClear();
        let resolveExecution!: (result: typeof execution.result) => void;
        execution.pending = new Promise(resolve => { resolveExecution = resolve; });
        const stepper = await render({ onFailed });
        await submit(stepper);
        await unmount(stepper);
        await act(async () => resolveExecution(execution.result));
        execution.pending = undefined;
    });
    it('should call onFailed', () => { onFailed.mock.calls.length.should.equal(1); });
});
