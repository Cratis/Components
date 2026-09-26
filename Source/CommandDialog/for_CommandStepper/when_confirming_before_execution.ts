// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { vi } from 'vitest';
import { execution, render, submit, submitButton, unmount, type InlineStepperInTheDom } from './given/an_inline_stepper_in_the_dom';

describe('when confirming an inline stepper submission', () => {
    let stepper: InlineStepperInTheDom;
    let approvedCalls: number;
    let declinedCalls: number;
    let submitEnabledAfterDecline: boolean;
    let failedCallsAfterDecline: number;
    let exceptionCallsAfterDecline: number;
    const onSuccess = vi.fn();
    const onFailed = vi.fn();
    const onException = vi.fn();
    const guard = vi.fn(async () => false);

    beforeEach(async () => {
        execution.calls = 0;
        onSuccess.mockClear(); onFailed.mockClear(); onException.mockClear();
        guard.mockClear().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        stepper = await render({ confirmBeforeExecute: guard, onSuccess, onFailed, onException });
        await submit(stepper);
        declinedCalls = execution.calls;
        failedCallsAfterDecline = onFailed.mock.calls.length;
        exceptionCallsAfterDecline = onException.mock.calls.length;
        submitEnabledAfterDecline = !submitButton(stepper).disabled;
        await submit(stepper);
        approvedCalls = execution.calls;
    });
    afterEach(async () => await unmount(stepper));

    it('should not run or report a declined submission', () => {
        declinedCalls.should.equal(0);
        failedCallsAfterDecline.should.equal(0);
        exceptionCallsAfterDecline.should.equal(0);
    });
    it('should permit another submit after decline', () => { submitEnabledAfterDecline.should.equal(true); });
    it('should run an approved submission', () => { approvedCalls.should.equal(1); });
});
