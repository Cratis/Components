// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { vi } from 'vitest';
import { execution, render, submit, submitButton, unmount, type InlineStepperInTheDom } from '../given/an_inline_stepper_in_the_dom';

describe('when inline stepper execution fails without a guard', () => {
    let stepper: InlineStepperInTheDom;
    let busyInFailure: boolean;
    const onFailed = vi.fn();
    beforeEach(async () => {
        execution.result.isSuccess = false;
        execution.pending = undefined;
        onFailed.mockReset().mockImplementation(() => { busyInFailure = submitButton(stepper).disabled; });
        stepper = await render({ onFailed });
        await submit(stepper);
    });
    afterEach(async () => { await unmount(stepper); });
    it('should clear busy before onFailed', () => { busyInFailure.should.equal(false); });
});
