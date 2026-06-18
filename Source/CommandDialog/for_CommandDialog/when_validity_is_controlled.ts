// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';

const { commandFormValidity } = vi.hoisted(() => ({
    commandFormValidity: { isValid: false }
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
    useDialogContext: () => undefined,
}));

vi.mock('@cratis/arc.react/commands', () => ({
    CommandForm: (props: { children?: React.ReactNode }) =>
        React.createElement('div', null, props.children),
    useCommandFormContext: () => ({
        isValid: commandFormValidity.isValid,
        setCommandValues: () => {},
        setCommandResult: () => {},
    }),
    useCommandInstance: () => ({
        execute: async () => ({ isSuccess: true, isValid: true, validationResults: [] }),
    }),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

class TestCommand {
    name: string = '';
}

describe('when CommandDialog validity is controlled', () => {
    let CommandDialog: typeof import('../CommandDialog').CommandDialog;

    beforeEach(async () => {
        vi.resetModules();
        CommandDialog = (await import('../CommandDialog')).CommandDialog;
    });

    const renderDialog = (props?: { isValid?: boolean }) => renderToStaticMarkup(
        React.createElement(CommandDialog, {
            command: TestCommand as unknown as new () => object,
            visible: true,
            title: 'Test Dialog',
            ...props
        })
    );

    const getOkButton = (html: string) => html.match(/<button[^>]*>Ok<\/button>/)?.[0] ?? '';

    afterEach(() => {
        commandFormValidity.isValid = true;
    });

    it('should_use_command_form_validity_when_isValid_is_not_provided', () => {
        commandFormValidity.isValid = false;

        const html = renderDialog();

        getOkButton(html).should.include('disabled');
    });

    it('should_allow_isValid_true_to_override_invalid_command_form_state', () => {
        commandFormValidity.isValid = false;

        const html = renderDialog({ isValid: true });

        getOkButton(html).should.not.include('disabled');
    });

    it('should_allow_isValid_false_to_disable_an_internally_valid_form', () => {
        commandFormValidity.isValid = true;

        const html = renderDialog({ isValid: false });

        getOkButton(html).should.include('disabled');
    });
});
