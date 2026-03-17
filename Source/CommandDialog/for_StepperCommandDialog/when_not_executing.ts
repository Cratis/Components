// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { StepperCommandDialog } from '../StepperCommandDialog';
import { StepperPanel } from 'primereact/stepperpanel';

vi.mock('primereact/dialog', () => ({
    Dialog: (props: { footer?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.footer, props.children),
}));

vi.mock('primereact/stepper', () => ({
    Stepper: (props: { children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'stepper' }, props.children),
}));

vi.mock('primereact/stepperpanel', () => ({
    StepperPanel: (props: { header?: string; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'stepper-panel', 'data-header': props.header }, props.children),
}));

vi.mock('primereact/button', () => ({
    Button: (props: { label?: string; disabled?: boolean; loading?: boolean; icon?: string }) =>
        React.createElement('button', { disabled: props.disabled, 'data-loading': props.loading }, props.label),
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
        isValid: true,
        setCommandValues: () => {},
        setCommandResult: () => {},
    }),
    useCommandInstance: () => ({}),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

class TestCommand {
    name: string = '';
    description: string = '';
}

describe('when StepperCommandDialog is in its initial state', () => {
    let html: string;

    beforeEach(() => {
        const element = React.createElement(
            StepperCommandDialog<TestCommand>,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Stepper Dialog',
            },
            React.createElement(StepperPanel, { header: 'Step 1' }, 'Step 1 content'),
            React.createElement(StepperPanel, { header: 'Step 2' }, 'Step 2 content')
        );
        html = renderToStaticMarkup(element);
    });

    it('should_not_have_buttons_disabled_due_to_busy', () => {
        html.should.not.include('data-loading="true"');
    });

    it('should_not_show_previous_button_on_first_step', () => {
        html.should.not.include('>Previous<');
    });

    it('should_show_next_button_on_first_step', () => {
        html.should.include('>Next<');
    });

    it('should_not_show_submit_button_on_first_step', () => {
        html.should.not.include('>Submit<');
    });

    it('should_not_show_cancel_button', () => {
        html.should.not.include('>Cancel<');
    });
});
