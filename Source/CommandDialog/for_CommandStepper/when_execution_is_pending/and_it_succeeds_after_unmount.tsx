// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { vi } from 'vitest';
import { execution, render, submit, unmount } from '../given/an_inline_stepper_in_the_dom';

describe('when inline stepper execution succeeds after unmount without a guard', () => {
    const onSuccess = vi.fn();
    beforeEach(async () => {
        execution.result.isSuccess = true;
        onSuccess.mockClear();
        let resolveExecution!: (result: typeof execution.result) => void;
        execution.pending = new Promise(resolve => { resolveExecution = resolve; });
        const stepper = await render({ onSuccess });
        await submit(stepper);
        await unmount(stepper);
        await act(async () => resolveExecution(execution.result));
        execution.pending = undefined;
    });
    it('should call onSuccess', () => { onSuccess.mock.calls.length.should.equal(1); });
});
