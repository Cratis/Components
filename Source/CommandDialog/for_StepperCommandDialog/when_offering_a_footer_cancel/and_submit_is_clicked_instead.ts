// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React from 'react';
import { vi } from 'vitest';
import { StepperPanel } from 'primereact/stepperpanel';
import { StepperCommandDialog } from '../../StepperCommandDialog';
import {
    buttonLabels,
    click,
    render,
    unmount,
    type StepperDialogInTheDom
} from '../given/a_stepper_dialog_in_the_dom';

const { closeDialog } = vi.hoisted(() => ({ closeDialog: vi.fn() }));

vi.mock('primereact/dialog', () => ({
    Dialog: (props: { footer?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.footer, props.children),
}));

vi.mock('primereact/stepper', () => ({
    Stepper: (props: { children?: React.ReactNode; activeStep?: number }) =>
        React.createElement('div', { 'data-testid': 'stepper', 'data-active-step': props.activeStep }, props.children),
}));

vi.mock('primereact/stepperpanel', () => ({
    StepperPanel: (props: { header?: string; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'stepper-panel', 'data-header': props.header }, props.children),
}));

vi.mock('primereact/button', () => ({
    Button: (props: { label?: string; disabled?: boolean; onClick?: () => void }) =>
        React.createElement('button', { disabled: props.disabled, onClick: props.onClick }, props.label),
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => ({ closeDialog }),
}));

// The context object is created once rather than per call: this spec renders for real, so an
// identity that changed on every render would re-run the stepper's error effect forever.
vi.mock('@cratis/arc.react/commands', () => {
    const commandFormContext = {
        isValid: true,
        setCommandValues: () => { },
        setCommandResult: () => { },
        getFieldError: () => undefined,
    };
    const commandInstance = {
        execute: async () => ({ isSuccess: true, isValid: true, validationResults: [], response: {} }),
    };

    return {
        CommandForm: (props: { children?: React.ReactNode }) =>
            React.createElement('div', null, props.children),
        useCommandFormContext: () => commandFormContext,
        useCommandInstance: () => commandInstance,
        CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
            React.createElement('div', null, props.field),
    };
});

class TestCommand {
    name: string = '';
}

const step = (header: string) => React.createElement(StepperPanel, { header }, `${header} content`);

const onCancel = vi.fn(() => true);
const onConfirm = vi.fn(() => true);

const aWizardOfferingCancel = () => React.createElement(
    StepperCommandDialog<TestCommand>,
    {
        command: TestCommand as unknown as new () => object,
        visible: true,
        title: 'Test Dialog',
        showCancel: true,
        onCancel,
        onConfirm,
    },
    step('Step 1'), step('Step 2'));

// The control for the cancel arm next door. It runs the exact same harness - same handlers, same
// dialog context, a footer that still carries Cancel - down the confirm path, so that "the confirm
// callback never ran" and "the context was closed with Cancelled" are claims this setup is able to
// falsify. Without it, a footer whose buttons all took the confirm arm and a footer whose confirm
// arm was unreachable would look identical.
describe('when submit is clicked on a wizard that also offers a footer cancel', () => {
    let dialog: StepperDialogInTheDom;
    let footerBeforeClicking: string[];

    beforeEach(async () => {
        closeDialog.mockClear();
        onCancel.mockClear();
        onConfirm.mockClear();

        dialog = await render(aWizardOfferingCancel());
        await click(dialog, 'Next');
        footerBeforeClicking = buttonLabels(dialog);

        await click(dialog, 'Submit');
    });

    afterEach(async () => await unmount(dialog));

    it('should_have_offered_cancel_alongside_submit', () => {
        footerBeforeClicking.should.deep.equal(['Cancel', 'Previous', 'Submit']);
    });

    it('should_invoke_the_confirm_callback_once', () => {
        onConfirm.mock.calls.length.should.equal(1);
    });

    it('should_leave_the_cancel_callback_alone', () => {
        onCancel.mock.calls.length.should.equal(0);
    });

    it('should_close_with_ok', () => {
        closeDialog.mock.calls[0][0].should.equal(3);
    });
});
