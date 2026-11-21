// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';

/**
 * The command result the mocked command returns. Specs set `validationResults` before rendering.
 */
export const refusal = {
    isSuccess: false,
    isValid: false,
    isAuthorized: true,
    hasExceptions: false,
    validationResults: [] as { message: string; members: string[] }[],
    exceptionMessages: [] as string[],
    exceptionStackTrace: '',
};

/** Stand-ins for `@cratis/arc.react/dialogs`. */
export const dialogs = {
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
};

/** Stand-ins for `@cratis/arc.react/commands` whose command always returns {@link refusal}. */
export const commands = {
    CommandForm: (props: { children?: React.ReactNode }) =>
        React.createElement('div', null, props.children),
    useCommandFormContext: () => ({
        isValid: true,
        setCommandValues: () => undefined,
        setCommandResult: () => undefined,
    }),
    useCommandInstance: () => ({ execute: async () => refusal }),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
};

/** The command the dialog runs. */
export class TestCommand {
    name = '';
}

/**
 * Two fields as the form renders them once the result is applied: the second is invalid.
 * @returns The field markup.
 */
export const Fields = () =>
    React.createElement(
        React.Fragment,
        null,
        React.createElement('input', { 'aria-label': 'Email' }),
        React.createElement('input', { 'aria-label': 'Name', 'aria-invalid': 'true' }),
    );
