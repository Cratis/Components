// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { vi } from 'vitest';
import {
    execution, render, SampleCommand, submit, submitButton, unmount,
    type InlineStepperInTheDom,
} from '../given/an_inline_stepper_in_the_dom';

describe('when a second submit is attempted during an async transform', () => {
    let stepper: InlineStepperInTheDom;
    let resolveTransform: (value: SampleCommand) => void;
    let disabledWhilePending: boolean;
    let disabledAfterSettling: boolean;
    let executeCalls: number;
    const onBeforeExecute = vi.fn();

    beforeEach(async () => {
        execution.calls = 0;
        execution.result.isSuccess = false;
        execution.result.isValid = true;
        execution.result.isAuthorized = true;
        execution.result.hasExceptions = false;
        onBeforeExecute.mockClear();
        const pendingTransform = new Promise<SampleCommand>((resolve) => {
            resolveTransform = resolve;
        });
        onBeforeExecute.mockReturnValue(pendingTransform);

        stepper = await render({ onBeforeExecute });
        await submit(stepper);
        disabledWhilePending = submitButton(stepper).disabled;
        await submit(stepper);
        await act(async () => resolveTransform(new SampleCommand()));
        executeCalls = execution.calls;
        disabledAfterSettling = submitButton(stepper).disabled;
    });

    afterEach(async () => await unmount(stepper));

    it('should disable Submit until the transform settles', () => {
        disabledWhilePending.should.be.true;
    });

    it('should execute the command only once', () => {
        executeCalls.should.equal(1);
    });

    it('should enable Submit after the command returns', () => {
        disabledAfterSettling.should.be.false;
    });
});
