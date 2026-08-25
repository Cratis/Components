// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import React from 'react';
import { vi } from 'vitest';
import { DialogResult, useDialogContext } from '@cratis/arc.react/dialogs';
import {
    click,
    render,
    unmount,
    type DialogInTheDom,
} from '../../Dialogs/for_Dialog/given/a_dialog_in_the_dom';
import { CommandDialog } from '../CommandDialog';

const { closeDialog, commandResult } = vi.hoisted(() => ({
    closeDialog: vi.fn(),
    commandResult: {
        isSuccess: true,
        isValid: true,
        validationResults: [],
    },
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => ({ closeDialog }),
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
    name: string = '';
}

const TestDialog = () => {
    const { closeDialog: closeWithResult } = useDialogContext<typeof commandResult>();

    return React.createElement(CommandDialog<TestCommand>, {
        command: TestCommand,
        title: 'Update user',
        onConfirm: async () => closeWithResult(DialogResult.Ok, commandResult),
        onCancel: async () => closeWithResult(DialogResult.Cancelled),
    });
};

describe('when confirming with close dialog and command result', () => {
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        closeDialog.mockReset();
        dialog = await render(React.createElement(TestDialog));
        await click('Ok');
    });

    afterEach(async () => unmount(dialog));

    it('should close once with ok and the command result', () => {
        expect(closeDialog.mock.calls).to.have.lengthOf(1);
        expect(closeDialog.mock.calls[0][0]).to.equal(3);
        expect(closeDialog.mock.calls[0][1]).to.equal(commandResult);
    });
});
