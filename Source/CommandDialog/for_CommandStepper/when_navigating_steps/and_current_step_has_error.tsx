// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { activeStep, click, onChangeStep, renderNavigation, unmount, validation, type InlineStepperInTheDom } from '../given/an_inline_stepper_in_the_dom';

let stepper: InlineStepperInTheDom;

afterEach(async () => await unmount(stepper));

describe('when navigating steps and the current step has an error', () => {
    beforeEach(async () => {
        validation.invalid = true;
        onChangeStep.mockClear();
        stepper = await renderNavigation(false);
        await click(stepper, 'Second');
    });

    it('should not move or report a change', () => {
        activeStep(stepper).should.equal('0');
        onChangeStep.mock.calls.should.deep.equal([]);
    });
});
