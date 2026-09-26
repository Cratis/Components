// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { vi } from 'vitest';
import { execution, render, submit, unmount, type InlineStepperInTheDom } from '../given/an_inline_stepper_in_the_dom';

describe('when the inline stepper command result is unauthorized', () => {
    let stepper: InlineStepperInTheDom;
    const onFailed = vi.fn();
    const onUnauthorized = vi.fn();

    beforeEach(async () => {
        execution.calls = 0;
        execution.result = {
            isSuccess: false,
            isValid: true,
            isAuthorized: false,
            hasExceptions: false,
            exceptionMessages: [],
            exceptionStackTrace: '',
            validationResults: [],
        };
        onFailed.mockClear();
        onUnauthorized.mockClear();
        stepper = await render({ onFailed, onUnauthorized });
        await submit(stepper);
    });

    afterEach(async () => await unmount(stepper));

    it('should call onUnauthorized', () => {
        onUnauthorized.mock.calls.length.should.equal(1);
    });

    it('should continue calling onFailed for the command result', () => {
        onFailed.mock.calls.length.should.equal(1);
    });
});
