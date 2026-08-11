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
    disabledButtonLabels,
    render,
    settle,
    unmount,
    type StepperDialogInTheDom
} from '../given/a_stepper_dialog_in_the_dom';

// The dialog is only busy for as long as the command it submitted is still running, so the spec
// owns that promise and decides when it finishes. `execute` reads the holder on every call rather
// than closing over one promise, which is what lets each spec start from a fresh, unsettled run.
const { execution } = vi.hoisted(() => {
    const execution: { settle: (result: unknown) => void; promise: Promise<unknown> } = {
        settle: () => { },
        promise: Promise.resolve({ isSuccess: false, isValid: true }),
    };

    return { execution };
});

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
    const commandInstance = { execute: () => execution.promise };

    return {
        CommandForm: (props: { children?: React.ReactNode }) =>
            React.createElement('div', null, props.children),
        useCommandFormContext: () => commandFormContext,
        useCommandInstance: () => commandInstance,
        CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
            React.createElement('div', null, props.field),
    };
});

/** Arms a fresh command run that will not finish until the spec says so. */
const anUnfinishedCommandRun = () => {
    execution.promise = new Promise(resolve => {
        execution.settle = resolve as (result: unknown) => void;
    });
};

/** Finishes the armed run the way a rejected command does - the dialog stays open. */
const aRejectedResult = { isSuccess: false, isValid: true };

class TestCommand {
    name: string = '';
}

const step = (header: string) => React.createElement(StepperPanel, { header }, `${header} content`);

const onCancel = vi.fn(() => true);

const aWizardOfferingCancel = (...steps: React.ReactElement[]) => React.createElement(
    StepperCommandDialog<TestCommand>,
    {
        command: TestCommand as unknown as new () => object,
        visible: true,
        title: 'Test Dialog',
        showCancel: true,
        onCancel,
    },
    ...steps);

// Busy is only reachable through Submit, and Submit only exists on the last step - so the state the
// dialog guards against is "the user pressed Submit and the command has not come back yet". A
// disabled attribute is asserted next to what it is supposed to buy: the click that a live Cancel
// would have honored does nothing while the command runs, and is honored again once it returns.
// Reading the attribute alone would pass just as happily on a dialog that disabled Cancel forever.
describe('when the command submitted from the last step has not returned', () => {
    let dialog: StepperDialogInTheDom;
    let footerBeforeSubmitting: string[];
    let disabledBeforeSubmitting: string[];
    let footerWhileRunning: string[];
    let disabledWhileRunning: string[];
    let cancelCallsWhileRunning: number;
    let disabledAfterReturning: string[];
    let cancelCallsAfterReturning: number;

    beforeEach(async () => {
        closeDialog.mockClear();
        onCancel.mockClear();
        anUnfinishedCommandRun();

        dialog = await render(aWizardOfferingCancel(step('Step 1'), step('Step 2'), step('Step 3')));
        await click(dialog, 'Next');
        await click(dialog, 'Next');
        footerBeforeSubmitting = buttonLabels(dialog);
        disabledBeforeSubmitting = disabledButtonLabels(dialog);

        await click(dialog, 'Submit');
        footerWhileRunning = buttonLabels(dialog);
        disabledWhileRunning = disabledButtonLabels(dialog);

        await click(dialog, 'Cancel');
        cancelCallsWhileRunning = onCancel.mock.calls.length;

        await settle(() => execution.settle(aRejectedResult));
        disabledAfterReturning = disabledButtonLabels(dialog);

        await click(dialog, 'Cancel');
        cancelCallsAfterReturning = onCancel.mock.calls.length;
    });

    afterEach(async () => await unmount(dialog));

    it('should_have_reached_the_last_step_with_cancel_live', () => {
        footerBeforeSubmitting.should.deep.equal(['Cancel', 'Previous', 'Submit']);
    });

    it('should_not_have_had_cancel_disabled_before_submitting', () => {
        disabledBeforeSubmitting.should.not.contain('Cancel');
    });

    it('should_keep_cancel_in_the_footer_while_the_command_runs', () => {
        footerWhileRunning.should.deep.equal(['Cancel', 'Previous', 'Submit']);
    });

    it('should_disable_cancel_while_the_command_runs', () => {
        disabledWhileRunning.should.contain('Cancel');
    });

    it('should_ignore_a_cancel_click_while_the_command_runs', () => {
        cancelCallsWhileRunning.should.equal(0);
    });

    it('should_release_cancel_once_the_command_returns', () => {
        disabledAfterReturning.should.not.contain('Cancel');
    });

    it('should_honor_a_cancel_click_once_the_command_returns', () => {
        cancelCallsAfterReturning.should.equal(1);
    });
});

// A one-step wizard is its own first and last step, which is the only shape where the busy footer
// carries no Previous - the cell of the state machine where Cancel is the leading button *and* the
// dialog is working. On a middle step there is no Submit to press and Previous is itself disabled
// while busy, so a busy middle step cannot be reached at all.
describe('when the command submitted from the only step has not returned', () => {
    let dialog: StepperDialogInTheDom;
    let footerWhileRunning: string[];
    let disabledWhileRunning: string[];
    let cancelCallsWhileRunning: number;

    beforeEach(async () => {
        closeDialog.mockClear();
        onCancel.mockClear();
        anUnfinishedCommandRun();

        dialog = await render(aWizardOfferingCancel(step('Only Step')));
        await click(dialog, 'Submit');
        footerWhileRunning = buttonLabels(dialog);
        disabledWhileRunning = disabledButtonLabels(dialog);

        await click(dialog, 'Cancel');
        cancelCallsWhileRunning = onCancel.mock.calls.length;

        await settle(() => execution.settle(aRejectedResult));
    });

    afterEach(async () => await unmount(dialog));

    it('should_still_lead_the_footer_with_cancel', () => {
        footerWhileRunning.should.deep.equal(['Cancel', 'Submit']);
    });

    it('should_disable_cancel_while_the_command_runs', () => {
        disabledWhileRunning.should.contain('Cancel');
    });

    it('should_ignore_a_cancel_click_while_the_command_runs', () => {
        cancelCallsWhileRunning.should.equal(0);
    });
});
