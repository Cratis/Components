// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { vi } from 'vitest';
import { execution, render, submit, submitButton, unmount, type InlineStepperInTheDom } from '../given/an_inline_stepper_in_the_dom';

describe('when inline stepper execution succeeds without a guard', () => {
    let stepper: InlineStepperInTheDom;
    let busyInSuccess: boolean;
    const onSuccess = vi.fn();
    beforeEach(async () => {
        execution.result.isSuccess = true;
        execution.pending = undefined;
        onSuccess.mockReset().mockImplementation(() => { busyInSuccess = submitButton(stepper).disabled; });
        stepper = await render({ onSuccess });
        await submit(stepper);
    });
    afterEach(async () => { await unmount(stepper); });
    it('should clear busy before onSuccess', () => { busyInSuccess.should.equal(false); });
});
