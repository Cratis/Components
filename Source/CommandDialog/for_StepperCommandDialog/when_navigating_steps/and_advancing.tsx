// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { mount, onChangeStep, validation } from '../given/a_navigable_dialog_in_the_dom';
import { activeStep, click, unmount, type StepperDialogInTheDom } from '../given/a_stepper_dialog_in_the_dom';

let dialog: StepperDialogInTheDom;

afterEach(async () => await unmount(dialog));

describe('when navigating dialog steps and advancing', () => {
    beforeEach(async () => {
        validation.invalid = false;
        onChangeStep.mockClear();
        dialog = await mount();
        await click(dialog, 'Next');
    });

    it('should report the new index once', () => {
        activeStep(dialog).should.equal('1');
        onChangeStep.mock.calls.should.deep.equal([[{ index: 1 }]]);
    });
});
