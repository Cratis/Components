// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ICommandResult } from '@cratis/arc/commands';
import { beforeEach, describe, it, vi } from 'vitest';

const { toastCalls } = vi.hoisted(() => ({
    toastCalls: {
        success: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('../toast', () => ({ toast: toastCalls }));

import { toastCommandResult } from '../toastCommandResult';

// SAFETY: toastCommandResult only reads messages from the validation results in these specs.
const validationResults = [
    { message: 'Name is required' },
    { message: '' },
    { message: 'Email is invalid' },
] as unknown as ICommandResult['validationResults'];

// SAFETY: These specs supply every command-result field read by toastCommandResult.
const result = {
    isSuccess: false,
    isAuthorized: true,
    isValid: false,
    hasExceptions: false,
    validationResults,
    exceptionMessages: [],
} as unknown as ICommandResult;

beforeEach(() => vi.clearAllMocks());

describe.each(['  Review the highlighted fields.\nThen try again.  ', ''])(
    'when configuring the validation description with the string %j',
    (validationDescription) => {
        let returned: boolean;

        beforeEach(() => {
            returned = toastCommandResult(result, { validationDescription });
        });

        it('should use the string verbatim without changing the validation title', () => {
            toastCalls.error.mock.calls.should.deep.equal([
                [{ title: 'Validation failed', description: validationDescription }],
            ]);
        });

        it('should still return false', () => returned.should.be.false);
    },
);

describe('when mapping the validation description with a function', () => {
    const mapDescription = vi.fn((validationResults: ICommandResult['validationResults']) =>
        `Please review ${validationResults.length} fields.`,
    );

    beforeEach(() => {
        toastCommandResult(result, { validationDescription: mapDescription });
    });

    it('should pass the original validation results to the function once', () => {
        mapDescription.mock.calls.should.have.lengthOf(1);
        mapDescription.mock.calls[0][0].should.equal(validationResults);
    });

    it('should use the function result as the description', () => {
        toastCalls.error.mock.calls.should.deep.equal([
            [{ title: 'Validation failed', description: 'Please review 3 fields.' }],
        ]);
    });
});

describe.each([
    ['undefined', undefined],
    ['an empty string', ''],
])('when the validation description function returns %s', (_label, description) => {
    beforeEach(() => {
        toastCommandResult(result, { validationDescription: () => description });
    });

    it('should show only the validation title without falling back to validation messages', () => {
        toastCalls.error.mock.calls.should.deep.equal([
            [{ title: 'Validation failed', description: undefined }],
        ]);
    });
});

describe('when no validation description is supplied', () => {
    beforeEach(() => {
        toastCommandResult(result);
    });

    it('should join only non-empty validation messages with newlines', () => {
        toastCalls.error.mock.calls.should.deep.equal([
            [{ title: 'Validation failed', description: 'Name is required\nEmail is invalid' }],
        ]);
    });
});

describe('when no validation messages or description are supplied', () => {
    beforeEach(() => {
        toastCommandResult({ ...result, validationResults: [] });
    });

    it('should show only the validation title', () => {
        toastCalls.error.mock.calls.should.deep.equal([
            [{ title: 'Validation failed', description: undefined }],
        ]);
    });
});

describe.each([
    ['succeeded', { isSuccess: true }],
    ['was not authorized', { isAuthorized: false }],
    ['threw an exception', { isValid: true, hasExceptions: true }],
    ['had no matching flags', { isValid: true }],
] satisfies [string, Partial<ICommandResult>][])(
    'when the command %s with a validation description function',
    (_label, flags) => {
        const mapDescription = vi.fn(() => 'Review the highlighted fields.');

        beforeEach(() => {
            toastCommandResult({ ...result, ...flags }, { validationDescription: mapDescription });
        });

        it('should not call the validation description function', () => {
            mapDescription.mock.calls.should.have.lengthOf(0);
        });
    },
);
