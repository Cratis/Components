// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { beforeEach, afterEach, describe, it } from 'vitest';
import { mount, onSuccess, reset, state, submit } from '../given/a_submission';
import { unmount } from '../given/a_stepper_dialog_in_the_dom';
import type { StepperDialogInTheDom } from '../given/a_stepper_dialog_in_the_dom';

describe('when stepper dialog execution succeeds without a guard', () => {
    let dialog: StepperDialogInTheDom;
    let busyInSuccess: boolean;
    beforeEach(async () => {
        reset();
        state.execute.mockResolvedValue({ isSuccess: true, response: {} });
        onSuccess.mockImplementation(() => { busyInSuccess = state.busy; });
        dialog = await mount({ onSuccess });
        await submit();
    });
    afterEach(async () => { await unmount(dialog); });
    it('should clear busy before onSuccess', () => { busyInSuccess.should.equal(false); });
});
