// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { clickHeader, mount, onChangeStep, validation } from '../given/a_navigable_dialog_in_the_dom';
import { activeStep, unmount, type StepperDialogInTheDom } from '../given/a_stepper_dialog_in_the_dom';

let dialog: StepperDialogInTheDom;

afterEach(async () => await unmount(dialog));

describe('when navigating dialog steps and the current step has an error', () => {
    beforeEach(async () => {
        validation.invalid = true;
        onChangeStep.mockClear();
        dialog = await mount(false);
        await clickHeader(dialog, 'Second');
    });

    it('should not move or report a change', () => {
        activeStep(dialog).should.equal('0');
        onChangeStep.mock.calls.should.deep.equal([]);
    });
});
