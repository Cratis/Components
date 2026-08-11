// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React from 'react';
import { vi } from 'vitest';
import { StepperPanel } from 'primereact/stepperpanel';
import { StepperCommandDialog } from '../../StepperCommandDialog';
import {
    click,
    pressEscape,
    render,
    settle,
    unmount,
    type StepperDialogInTheDom
} from '../given/a_stepper_dialog_in_the_dom';

// The dialog is only busy for as long as the command it submitted is still running, so the spec
// owns that promise and decides when it finishes.
const { execution } = vi.hoisted(() => {
    const execution: { settle: (result: unknown) => void; promise: Promise<unknown> } = {
        settle: () => { },
        promise: Promise.resolve({ isSuccess: false, isValid: true }),
    };

    return { execution };
});

const { closeDialog } = vi.hoisted(() => ({ closeDialog: vi.fn() }));

// PrimeReact hides on Escape only while `closable && closeOnEscape` - both default to true, and its
// Dialog computes exactly that conjunction before subscribing to the key. The mock reproduces the
// conjunction so Escape is exercised as a dismissal rather than read back as a prop value.
vi.mock('primereact/dialog', () => ({
    Dialog: (props: {
        closable?: boolean;
        closeOnEscape?: boolean;
        onHide?: () => void;
        footer?: React.ReactNode;
        children?: React.ReactNode;
    }) => {
        const closesOnEscape = props.closable !== false && props.closeOnEscape !== false;
        const onHide = props.onHide;

        React.useEffect(() => {
            if (!closesOnEscape) {
                return () => { };
            }

            const dismiss = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    onHide?.();
                }
            };

            document.addEventListener('keydown', dismiss);
            return () => document.removeEventListener('keydown', dismiss);
        }, [closesOnEscape, onHide]);

        return React.createElement('div', { 'data-testid': 'dialog' }, props.footer, props.children);
    },
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

const onCancel = vi.fn(() => true);

const aWizard = () => React.createElement(
    StepperCommandDialog<TestCommand>,
    {
        command: TestCommand as unknown as new () => object,
        visible: true,
        title: 'Test Dialog',
        onCancel,
    },
    React.createElement(StepperPanel, { header: 'Only Step' }, 'Only Step content'));

// Escape is the dismissal with no control to disable - the dialog can only refuse it by telling
// PrimeReact not to listen while the command runs. Pressing it in both states is what separates
// "refused for now" from "never listened at all": the second press, after the command has returned,
// has to be honored, or the silence during the run says nothing about the guard.
describe('when escape is pressed on a wizard whose command has not returned', () => {
    let dialog: StepperDialogInTheDom;
    let cancelCallsWhileRunning: number;
    let cancelCallsAfterReturning: number;

    beforeEach(async () => {
        closeDialog.mockClear();
        onCancel.mockClear();
        anUnfinishedCommandRun();

        dialog = await render(aWizard());
        await click(dialog, 'Submit');

        await pressEscape();
        cancelCallsWhileRunning = onCancel.mock.calls.length;

        await settle(() => execution.settle(aRejectedResult));

        await pressEscape();
        cancelCallsAfterReturning = onCancel.mock.calls.length;
    });

    afterEach(async () => await unmount(dialog));

    it('should_not_dismiss_on_escape_while_the_command_runs', () => {
        cancelCallsWhileRunning.should.equal(0);
    });

    it('should_dismiss_on_escape_once_the_command_returns', () => {
        cancelCallsAfterReturning.should.equal(1);
    });
});
