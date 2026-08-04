// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { DialogResult, useDialogContext } from '@cratis/arc.react/dialogs';

const { closeDialog, commandResult } = vi.hoisted(() => ({
    closeDialog: vi.fn(),
    commandResult: {
        isSuccess: true,
        isValid: true,
        validationResults: [],
    },
}));

vi.mock('primereact/dialog', () => {
    // PrimeReact 11's Dialog is compositional; each part is a pass-through that
    // renders its children so the footer buttons and content reach the markup.
    const part = (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children);
    return {
        Dialog: {
            Root: part, Portal: part, Backdrop: part, Positioner: part, Popup: part,
            Header: part, Title: part, Close: part, Content: part, Footer: part,
        },
    };
});

vi.mock('primereact/button', () => ({
    // PrimeReact 11 Button renders children (the v10 label/icon props are gone); the
    // confirm button carries autoFocus, which stands in for the click in this SSR render.
    Button: (props: { autoFocus?: boolean; onClick?: () => Promise<void> | void; disabled?: boolean; children?: React.ReactNode }) => {
        if (props.autoFocus && props.onClick) {
            void props.onClick();
        }
        return React.createElement('button', { disabled: props.disabled }, props.children);
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

describe('when confirming with close dialog and command result', () => {
    beforeEach(async () => {
        closeDialog.mockReset();

        // The project runs specs with `isolate: false`, so a module imported by an
        // earlier spec file stays cached with that file's mocks bound in, and the
        // order files run in is not stable between runs. Re-evaluate CommandDialog
        // under this file's own mocks so the confirm button is always the one that
        // fires onClick — a static import here makes this spec pass or fail by luck.
        vi.resetModules();
        const { CommandDialog } = await import('../CommandDialog');

        const TestDialog = () => {
            const { closeDialog: closeWithResult } = useDialogContext<typeof commandResult>();

            return React.createElement(CommandDialog<TestCommand>, {
                command: TestCommand,
                title: 'Update user',
                onConfirm: async () => closeWithResult(DialogResult.Ok, commandResult),
                onCancel: async () => closeWithResult(DialogResult.Cancelled),
            });
        };

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
