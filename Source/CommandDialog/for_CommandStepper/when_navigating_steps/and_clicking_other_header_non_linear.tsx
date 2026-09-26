// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { activeStep, click, onChangeStep, renderNavigation, unmount, validation, type InlineStepperInTheDom } from '../given/an_inline_stepper_in_the_dom';

let stepper: InlineStepperInTheDom;

afterEach(async () => await unmount(stepper));

describe('when navigating steps and clicking another header in non-linear mode', () => {
    beforeEach(async () => {
        validation.invalid = false;
        onChangeStep.mockClear();
        stepper = await renderNavigation(false);
        await click(stepper, 'Second');
    });

    it('should report the new index once', () => {
        activeStep(stepper).should.equal('1');
        onChangeStep.mock.calls.should.deep.equal([[{ index: 1 }]]);
    });
});
