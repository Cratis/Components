// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React from 'react';
import { vi } from 'vitest';
import { StepperPanel } from '../../StepperPanel';
import { StepperCommandDialog } from '../../StepperCommandDialog';
import {
    buttonLabels,
    click,
    render,
    unmount,
    type StepperDialogInTheDom
} from '../given/a_stepper_dialog_in_the_dom';

const { closeDialog } = vi.hoisted(() => ({ closeDialog: vi.fn() }));

vi.mock('../../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.buttons, props.children),
}));



vi.mock('../../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean; onClick?: () => void }) =>
        React.createElement('button', { disabled: props.disabled, onClick: props.onClick }, props.children),
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

    return {
        CommandForm: (props: { children?: React.ReactNode }) =>
            React.createElement('div', null, props.children),
        useCommandFormContext: () => commandFormContext,
        useCommandInstance: () => ({}),
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

// Closing is not the point - the dialog closes on submit too. The point is *which* arm of
// handleClose the button takes, so the dialog is given a cancel handler and a confirm handler
// that are told apart by which one ran, and the result handed to the dialog context is read as a
// value rather than as "something happened". Cancelled is 4 in the mocked DialogResult; Ok is 3.
describe('when the footer cancel is clicked', () => {
    let dialog: StepperDialogInTheDom;
    let footerBeforeClicking: string[];

    beforeEach(async () => {
        closeDialog.mockClear();
        onCancel.mockClear();
        onConfirm.mockClear();

        dialog = await render(aWizardOfferingCancel());
        footerBeforeClicking = buttonLabels(dialog);

        await click(dialog, 'Cancel');
    });

    afterEach(async () => await unmount(dialog));

    it('should_have_offered_a_cancel_to_click', () => {
        footerBeforeClicking.should.deep.equal(['Cancel', 'Next']);
    });

    it('should_invoke_the_cancel_callback_once', () => {
        onCancel.mock.calls.length.should.equal(1);
    });

    it('should_leave_the_confirm_callback_alone', () => {
        onConfirm.mock.calls.length.should.equal(0);
    });

    it('should_close_through_the_dialog_context_once', () => {
        closeDialog.mock.calls.length.should.equal(1);
    });

    it('should_close_with_cancelled', () => {
        closeDialog.mock.calls[0][0].should.equal(4);
    });
});
