// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import React from 'react';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import {
    click,
    render,
    unmount,
    type DialogInTheDom,
} from '../../Dialogs/for_Dialog/given/a_dialog_in_the_dom';
import { CommandDialog } from '../CommandDialog';

const callbacks = vi.hoisted(() => ({
    failed: vi.fn(),
    exception: vi.fn(),
    unauthorized: vi.fn(),
    validation: vi.fn(),
}));

const commandResult = {
    isSuccess: false,
    isValid: false,
    isAuthorized: false,
    hasExceptions: true,
    validationResults: [{ message: 'Name is required', members: ['name'] }],
    exceptionMessages: ['Command failed'],
    exceptionStackTrace: 'stack',
};

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
}));

vi.mock('@cratis/arc.react/commands', () => ({
    CommandForm: (props: { children?: React.ReactNode }) =>
        React.createElement('div', null, props.children),
    useCommandFormContext: () => ({
        isValid: true,
        setCommandValues: () => undefined,
        setCommandResult: () => undefined,
    }),
    useCommandInstance: () => ({ execute: async () => commandResult }),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

class TestCommand {
    name = '';
}

describe('when command execution fails', () => {
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        Object.values(callbacks).forEach((callback) => callback.mockReset());
        dialog = await render(
            <CommandDialog<TestCommand>
                command={TestCommand}
                title='Update user'
                onFailed={callbacks.failed}
                onException={callbacks.exception}
                onUnauthorized={callbacks.unauthorized}
                onValidationFailure={callbacks.validation}
            />,
        );
        await click('Ok');
    });

    afterEach(async () => unmount(dialog));

    it('should invoke the general and every matching granular callback', () => {
        expect(callbacks.failed.mock.calls).to.have.lengthOf(1);
        expect(callbacks.exception.mock.calls[0]).to.deep.equal([
            ['Command failed'],
            'stack',
        ]);
        expect(callbacks.unauthorized.mock.calls).to.have.lengthOf(1);
        expect(callbacks.validation.mock.calls[0][0]).to.deep.equal(
            commandResult.validationResults,
        );
    });
});
