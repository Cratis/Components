// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { StepperCommandDialog } from '../StepperCommandDialog';
import { StepperPanel } from '../StepperPanel';

// Render the Cratis Dialog wrapper's custom footer and body.
vi.mock('../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.buttons, props.children),
}));

vi.mock('../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean }) =>
        React.createElement('button', { disabled: props.disabled }, props.children),
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
        getFieldError: () => undefined,
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
                // SAFETY: The test command implements the runtime command constructor contract.
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Stepper Dialog',
            },
            React.createElement(StepperPanel, { header: 'Step 1' }, 'Step 1 content'),
            React.createElement(StepperPanel, { header: 'Step 2' }, 'Step 2 content')
        );
        html = renderToStaticMarkup(element);
    });

    it('should_not_have_buttons_in_a_busy_state', () => {
        html.should.not.include('cratis-dialog__spinner');
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
