// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { vi } from 'vitest';
import { execution, render, submit, unmount, type InlineStepperInTheDom } from '../given/an_inline_stepper_in_the_dom';

describe('when the inline stepper command result has exceptions', () => {
    let stepper: InlineStepperInTheDom;
    const onFailed = vi.fn();
    const onException = vi.fn();

    beforeEach(async () => {
        execution.calls = 0;
        execution.result = {
            isSuccess: false,
            isValid: true,
            isAuthorized: true,
            hasExceptions: true,
            exceptionMessages: ['Example exception'],
            exceptionStackTrace: 'Example stack trace',
            validationResults: [],
        };
        onFailed.mockClear();
        onException.mockClear();
        stepper = await render({ onFailed, onException });
        await submit(stepper);
    });

    afterEach(async () => await unmount(stepper));

    it('should call onException with the messages and stack trace', () => {
        onException.mock.calls.should.deep.equal([[
            ['Example exception'], 'Example stack trace',
        ]]);
    });

    it('should continue calling onFailed for the command result', () => {
        onFailed.mock.calls.length.should.equal(1);
    });
});
