// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';

const { commandFormValidity, executeCommand, setCommandValues } = vi.hoisted(() => ({
    commandFormValidity: { isValid: false },
    executeCommand: vi.fn(async () => ({ isSuccess: true, isValid: true, validationResults: [] })),
    setCommandValues: vi.fn()
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
    // PrimeReact 11 Button renders children (the v10 label/icon props are gone), and the
    // dialog marks the button its focus trap should land on with `data-autofocus` rather
    // than React's autoFocus prop. That marker identifies the confirm button, whose click
    // this SSR render stands in for.
    Button: (props: { 'data-autofocus'?: string; onClick?: () => Promise<void> | void; disabled?: boolean; children?: React.ReactNode }) => {
        if (props['data-autofocus'] !== undefined && props.onClick && props.disabled !== true) {
            void props.onClick();
        }
        return React.createElement('button', { disabled: props.disabled }, props.children);
    },
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
}));

vi.mock('@cratis/arc.react/commands', () => ({
    CommandForm: (props: { children?: React.ReactNode }) =>
        React.createElement('div', null, props.children),
    useCommandFormContext: () => ({
        isValid: commandFormValidity.isValid,
        setCommandValues,
        setCommandResult: () => {},
        getFieldError: (fieldName: string) =>
            fieldName === 'name' ? 'Name is required' : undefined,
    }),
    useCommandInstance: () => ({
        execute: executeCommand,
    }),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

class TestCommand {
    name: string = '';
}

describe('when CommandDialog validity is gated', () => {
    let CommandDialog: typeof import('../CommandDialog').CommandDialog;

    beforeEach(async () => {
        commandFormValidity.isValid = false;
        executeCommand.mockClear();
        setCommandValues.mockClear();
        vi.resetModules();
        CommandDialog = (await import('../CommandDialog')).CommandDialog;
    });

    const renderDialog = (props?: { isValid?: boolean; onBeforeExecute?: (values: TestCommand) => TestCommand }) => renderToStaticMarkup(
        React.createElement(CommandDialog, {
            // SAFETY: The generated command proxy constructor is erased by this SSR harness only.
            command: TestCommand as unknown as new () => object,
            visible: true,
            title: 'Test Dialog',
            ...props
        })
    );

    // The PrimeReact 11 Button renders its content as children, so the Ok button's
    // markup is `<button ...><i .../><span>Ok</span></button>` — find it by its label span.
    const getOkButton = (html: string) => (html.match(/<button[\s\S]*?<\/button>/g) ?? []).find(button => button.includes('>Ok<')) ?? '';

    afterEach(() => {
        commandFormValidity.isValid = true;
    });

    it('should_use_command_form_validity_when_isValid_is_not_provided', () => {
        commandFormValidity.isValid = false;

        const html = renderDialog();

        expect(getOkButton(html)).to.include('disabled');
        expect(executeCommand.mock.calls).to.have.lengthOf(0);
    });

    it('should_not_allow_isValid_true_to_override_invalid_command_form_state', () => {
        commandFormValidity.isValid = false;

        const html = renderDialog({
            isValid: true,
            onBeforeExecute: () => ({ name: 'External value' })
        });

        expect(getOkButton(html)).to.include('disabled');
        expect(setCommandValues.mock.calls).to.have.lengthOf(0);
        expect(executeCommand.mock.calls).to.have.lengthOf(0);
    });

    it('should_allow_isValid_false_to_disable_an_internally_valid_form', () => {
        commandFormValidity.isValid = true;

        const html = renderDialog({ isValid: false });

        expect(getOkButton(html)).to.include('disabled');
        expect(executeCommand.mock.calls).to.have.lengthOf(0);
    });

    it('should_enable_confirm_when_command_form_is_valid_and_isValid_is_not_provided', () => {
        commandFormValidity.isValid = true;

        const html = renderDialog();

        expect(getOkButton(html)).not.to.include('disabled');
        expect(executeCommand.mock.calls).to.have.lengthOf(0);
    });

    it('should_enable_confirm_when_command_form_is_valid_and_isValid_is_true', () => {
        commandFormValidity.isValid = true;

        const html = renderDialog({
            isValid: true,
            onBeforeExecute: () => ({ name: 'External value' })
        });

        expect(getOkButton(html)).not.to.include('disabled');
        expect(setCommandValues.mock.calls).to.have.lengthOf(0);
        expect(executeCommand.mock.calls).to.have.lengthOf(0);
    });
});
