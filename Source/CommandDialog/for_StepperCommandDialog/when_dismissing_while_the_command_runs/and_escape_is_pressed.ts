// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React from 'react';
import { vi } from 'vitest';
import { StepperPanel } from '../../StepperPanel';
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

vi.mock('../../../Dialogs/Dialog', () => ({
    Dialog: (props: {
        dismissable?: boolean;
        onCancel?: () => void;
        buttons?: React.ReactNode;
        children?: React.ReactNode;
    }) => {
        const closesOnEscape = props.dismissable !== false;
        const onCancel = props.onCancel;

        React.useEffect(() => {
            if (!closesOnEscape) {
                return () => { };
            }

            const dismiss = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    onCancel?.();
                }
            };

            document.addEventListener('keydown', dismiss);
            return () => document.removeEventListener('keydown', dismiss);
        }, [closesOnEscape, onCancel]);

        return React.createElement('div', { 'data-testid': 'dialog' }, props.buttons, props.children);
    },
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
        // SAFETY: The test command implements the runtime command constructor contract.
        command: TestCommand as unknown as new () => object,
        visible: true,
        title: 'Test Dialog',
        onCancel,
    },
    React.createElement(StepperPanel, { header: 'Only Step' }, 'Only Step content'));

// Escape has no visible control to disable. Pressing it in both states separates "refused while
// busy" from "never listened at all": the second press, after the command returns, must be honored.
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
