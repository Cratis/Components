// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { vi } from 'vitest';
import { execution, render, submit, unmount, type InlineStepperInTheDom } from '../given/an_inline_stepper_in_the_dom';

describe('when the inline stepper command result has validation errors', () => {
    let stepper: InlineStepperInTheDom;
    const onFailed = vi.fn();
    const onValidationFailure = vi.fn();
    const validationResults = [{ property: 'name', message: 'Name is required' }];

    beforeEach(async () => {
        execution.calls = 0;
        execution.result = {
            isSuccess: false,
            isValid: false,
            isAuthorized: true,
            hasExceptions: false,
            exceptionMessages: [],
            exceptionStackTrace: '',
            validationResults,
        };
        onFailed.mockClear();
        onValidationFailure.mockClear();
        stepper = await render({ onFailed, onValidationFailure });
        await submit(stepper);
    });

    afterEach(async () => await unmount(stepper));

    it('should call onValidationFailure with the validation results', () => {
        onValidationFailure.mock.calls.should.deep.equal([[validationResults]]);
    });

    it('should also call onFailed with the command result', () => {
        onFailed.mock.calls.should.deep.equal([[execution.result]]);
    });
});
