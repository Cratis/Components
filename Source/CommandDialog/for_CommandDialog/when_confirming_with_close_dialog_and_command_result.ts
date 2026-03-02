// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { DialogResult, useDialogContext } from '@cratis/arc.react/dialogs';
import { CommandDialog } from '../CommandDialog';

const { closeDialog, commandResult } = vi.hoisted(() => ({
    closeDialog: vi.fn(),
    commandResult: {
        isSuccess: true,
        isValid: true,
        validationResults: [],
    },
}));

vi.mock('primereact/dialog', () => ({
    Dialog: (props: { footer?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', null, props.footer, props.children),
}));

vi.mock('primereact/button', () => ({
    Button: (props: { icon?: string; label?: string; onClick?: () => Promise<void> | void; disabled?: boolean }) => {
        if (props.icon === 'pi pi-check' && props.onClick) {
            props.onClick();
        }
        return React.createElement('button', { disabled: props.disabled }, props.label);
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
        setCommandValues: () => {},
        setCommandResult: () => {},
    }),
    useCommandInstance: () => ({
        execute: async () => commandResult,
    }),
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
    beforeEach(() => {
        closeDialog.mockReset();
        renderToStaticMarkup(React.createElement(TestDialog));
    });

    it('should_close_once_with_ok_and_the_command_result', () => {
        if (closeDialog.mock.calls.length !== 1) {
            throw new Error(`Expected one closeDialog call, got ${closeDialog.mock.calls.length}`);
        }
        closeDialog.mock.calls[0][0].should.equal(3);
        closeDialog.mock.calls[0][1].should.equal(commandResult);
    });
});
