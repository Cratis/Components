// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandDialog } from '../CommandDialog';

vi.mock('primereact/dialog', () => ({
    Dialog: (props: { footer?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', null, props.footer, props.children)
}));

vi.mock('primereact/button', () => ({
    Button: (props: { label?: string; disabled?: boolean }) =>
        React.createElement('button', { disabled: props.disabled }, props.label)
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined
}));

vi.mock('@cratis/arc.react/commands', () => ({
    CommandForm: (props: { children?: React.ReactNode }) =>
        React.createElement('div', null, props.children),
    useCommandFormContext: () => ({
        isValid: true,
        setCommandValues: () => {},
        setCommandResult: () => {}
    }),
    useCommandInstance: () => ({}),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field)
}));

class TestCommand {
    name: string = '';
}

describe('when CommandDialog is given initial valid values', () => {
    let html: string;

    beforeEach(() => {
        const element = React.createElement(CommandDialog, {
            command: TestCommand as unknown as new () => object,
            initialValues: { name: 'John Doe' } as Partial<TestCommand>,
            visible: true,
            title: 'Test Dialog'
        });
        html = renderToStaticMarkup(element);
    });

    it('should_be_valid', () => {
        html.should.not.include('disabled');
    });
});
