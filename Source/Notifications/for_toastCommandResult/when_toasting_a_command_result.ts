// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { beforeEach, describe, it, vi } from 'vitest';
import type { ICommandResult } from '@cratis/arc/commands';

// One file for all outcomes: the project runs specs with `isolate: false`, so a
// single module load + one mock avoids the cross-file mock caching that
// separate files (or vi.resetModules) would run into.
const { calls } = vi.hoisted(() => ({
    calls: {
        success: [] as { title: string; description?: string }[],
        warn: [] as { title: string }[],
        error: [] as { title: string; description?: string }[],
    },
}));

vi.mock('../toast', () => ({
    toast: {
        success: (toast: { title: string; description?: string }) =>
            calls.success.push(toast),
        warn: (toast: { title: string }) => calls.warn.push(toast),
        error: (toast: { title: string; description?: string }) =>
            calls.error.push(toast),
    },
}));

import { toastCommandResult } from '../toastCommandResult';

const result = (over: Partial<ICommandResult>): ICommandResult => {
    // SAFETY: Specs provide every command-result field read by toastCommandResult.
    return {
        isSuccess: false,
        isAuthorized: true,
        isValid: true,
        hasExceptions: false,
        validationResults: [],
        exceptionMessages: [],
        ...over,
    } as unknown as ICommandResult;
};

const reset = () => {
    calls.success = [];
    calls.warn = [];
    calls.error = [];
};

describe('when toasting a command result and the command succeeded', () => {
    let returned: boolean;
    beforeEach(() => {
        reset();
        returned = toastCommandResult(result({ isSuccess: true }), {
            successTitle: 'Saved',
        });
    });

    it('should show a success toast with the provided title', () => {
        expect(calls.success).to.have.lengthOf(1);
        expect(calls.success[0].title).to.equal('Saved');
    });
    it('should not show a warning or error toast', () => {
        expect(calls.warn).to.have.lengthOf(0);
        expect(calls.error).to.have.lengthOf(0);
    });
    it('should return true', () => expect(returned).to.equal(true));
});

describe('when toasting a successful command result with success suppressed', () => {
    let returned: boolean;
    beforeEach(() => {
        reset();
        returned = toastCommandResult(result({ isSuccess: true }), {
            showSuccess: false,
        });
    });

    it('should show no toast', () => {
        expect(calls.success).to.have.lengthOf(0);
        expect(calls.warn).to.have.lengthOf(0);
        expect(calls.error).to.have.lengthOf(0);
    });
    it('should still return true', () => expect(returned).to.equal(true));
});

describe('when toasting a command result that was not authorized', () => {
    let returned: boolean;
    beforeEach(() => {
        reset();
        returned = toastCommandResult(result({ isAuthorized: false }));
    });

    it('should show a warning toast', () => expect(calls.warn).to.have.lengthOf(1));
    it('should not show a success or error toast', () => {
        expect(calls.success).to.have.lengthOf(0);
        expect(calls.error).to.have.lengthOf(0);
    });
    it('should return false', () => expect(returned).to.equal(false));
});

describe('when toasting a command result that failed validation', () => {
    let returned: boolean;
    beforeEach(() => {
        reset();
        // SAFETY: Validation messages are the only validation-result fields toastCommandResult reads.
        const validationResults = [
            { message: 'Name is required' },
            { message: 'Email is invalid' },
        ] as unknown as ICommandResult['validationResults'];
        returned = toastCommandResult(result({ isValid: false, validationResults }), {
            validationTitle: 'Could not save',
        });
    });

    it('should show an error toast with the validation title', () => {
        expect(calls.error).to.have.lengthOf(1);
        expect(calls.error[0].title).to.equal('Could not save');
    });
    it('should list every validation message in the description', () => {
        expect(calls.error[0].description ?? '').to.contain('Name is required');
        expect(calls.error[0].description ?? '').to.contain('Email is invalid');
    });
    it('should return false', () => expect(returned).to.equal(false));
});

describe('when toasting a command result that threw an exception', () => {
    let returned: boolean;
    beforeEach(() => {
        reset();
        returned = toastCommandResult(
            result({ hasExceptions: true, exceptionMessages: ['Boom at line 42'] }),
            { exceptionTitle: 'Something broke' },
        );
    });

    it('should show a generic error toast', () => {
        expect(calls.error).to.have.lengthOf(1);
        expect(calls.error[0].title).to.equal('Something broke');
    });
    it('should not leak the exception messages into the toast', () => {
        expect(calls.error[0].description ?? '').not.to.contain('Boom');
    });
    it('should return false', () => expect(returned).to.equal(false));
});
