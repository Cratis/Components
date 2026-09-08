// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ICommandResult } from '@cratis/arc/commands';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { setToastDispatch, type ToastDispatch, type ToastOptions } from '../toast';
import { toastCommandResult } from '../toastCommandResult';

const successCalls: ToastOptions[] = [];
const dispatch: ToastDispatch = {
    show: () => 'show',
    update: (id) => id,
    dismiss: () => undefined,
    promise: async (promise) => promise,
    success: (options) => {
        successCalls.push(options);
        return 'success';
    },
    info: () => 'info',
    warn: () => 'warn',
    error: () => 'error',
    secondary: () => 'secondary',
    contrast: () => 'contrast',
};
let restore: () => void;

beforeEach(() => {
    successCalls.length = 0;
    restore = setToastDispatch(dispatch);
});

afterEach(() => restore());

describe('when toasting a command result through a custom dispatch', () => {
    it('should route the command feedback through the Cratis contract', () => {
        // SAFETY: toastCommandResult reads only these supplied command-result fields.
        const result = {
            isSuccess: true,
            isAuthorized: true,
            isValid: true,
            hasExceptions: false,
            validationResults: [],
            exceptionMessages: [],
        } as unknown as ICommandResult;

        toastCommandResult(result, { successTitle: 'Registered' });

        expect(successCalls).to.deep.equal([
            { title: 'Registered', description: undefined },
        ]);
    });
});
