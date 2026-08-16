// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { vi } from 'vitest';
import type { ICommandResult } from '@cratis/arc/commands';

// One file for all outcomes: the project runs specs with `isolate: false`, so a
// single module load + one mock avoids the cross-file mock caching that
// separate files (or vi.resetModules) would run into.
const { calls } = vi.hoisted(() => ({ calls: { success: [] as { title: string; description?: string }[], warn: [] as { title: string }[], error: [] as { title: string; description?: string }[] } }));

vi.mock('primereact/toaster', () => ({
    toast: {
        success: (toast: { title: string; description?: string }) => calls.success.push(toast),
        warn: (toast: { title: string }) => calls.warn.push(toast),
        error: (toast: { title: string; description?: string }) => calls.error.push(toast),
    },
}));

import { toastCommandResult } from '../toastCommandResult';

const result = (over: Partial<ICommandResult>): ICommandResult =>
    ({ isSuccess: false, isAuthorized: true, isValid: true, hasExceptions: false, validationResults: [], exceptionMessages: [], ...over } as unknown as ICommandResult);

const reset = () => { calls.success = []; calls.warn = []; calls.error = []; };

describe('when toasting a command result and the command succeeded', () => {
    let returned: boolean;
    beforeEach(() => { reset(); returned = toastCommandResult(result({ isSuccess: true }), { successTitle: 'Saved' }); });

    it('should show a success toast with the provided title', () => {
        calls.success.should.have.lengthOf(1);
        calls.success[0].title.should.equal('Saved');
    });
    it('should not show a warning or error toast', () => {
        calls.warn.should.have.lengthOf(0);
        calls.error.should.have.lengthOf(0);
    });
    it('should return true', () => returned.should.be.true);
});

describe('when toasting a successful command result with success suppressed', () => {
    let returned: boolean;
    beforeEach(() => { reset(); returned = toastCommandResult(result({ isSuccess: true }), { showSuccess: false }); });

    it('should show no toast', () => {
        calls.success.should.have.lengthOf(0);
        calls.warn.should.have.lengthOf(0);
        calls.error.should.have.lengthOf(0);
    });
    it('should still return true', () => returned.should.be.true);
});

describe('when toasting a command result that was not authorized', () => {
    let returned: boolean;
    beforeEach(() => { reset(); returned = toastCommandResult(result({ isAuthorized: false })); });

    it('should show a warning toast', () => calls.warn.should.have.lengthOf(1));
    it('should not show a success or error toast', () => {
        calls.success.should.have.lengthOf(0);
        calls.error.should.have.lengthOf(0);
    });
    it('should return false', () => returned.should.be.false);
});

describe('when toasting a command result that failed validation', () => {
    let returned: boolean;
    beforeEach(() => {
        reset();
        returned = toastCommandResult(
            result({ isValid: false, validationResults: [{ message: 'Name is required' }, { message: 'Email is invalid' }] as unknown as ICommandResult['validationResults'] }),
            { validationTitle: 'Could not save' });
    });

    it('should show an error toast with the validation title', () => {
        calls.error.should.have.lengthOf(1);
        calls.error[0].title.should.equal('Could not save');
    });
    it('should list every validation message in the description', () => {
        (calls.error[0].description ?? '').should.contain('Name is required');
        (calls.error[0].description ?? '').should.contain('Email is invalid');
    });
    it('should return false', () => returned.should.be.false);
});

describe('when toasting a command result that threw an exception', () => {
    let returned: boolean;
    beforeEach(() => { reset(); returned = toastCommandResult(result({ hasExceptions: true, exceptionMessages: ['Boom at line 42'] }), { exceptionTitle: 'Something broke' }); });

    it('should show a generic error toast', () => {
        calls.error.should.have.lengthOf(1);
        calls.error[0].title.should.equal('Something broke');
    });
    it('should not leak the exception messages into the toast', () => {
        (calls.error[0].description ?? '').should.not.contain('Boom');
    });
    it('should return false', () => returned.should.be.false);
});
