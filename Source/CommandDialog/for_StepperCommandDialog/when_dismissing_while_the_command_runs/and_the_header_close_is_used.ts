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

// The Cratis Dialog renders the header close control only while `dismissable` — the single switch
// governing the header close, the backdrop and Escape in PrimeReact 11 — and routes it through the
// same `onCancel` arm the footer uses. The mock renders that control on the same condition instead
// of handing the prop back, so the spec presses the X the operator would press rather than reading
// what the dialog asked for.
vi.mock('../../../Dialogs/Dialog', () => ({
    Dialog: (props: {
        dismissable?: boolean;
        onCancel?: () => void;
        buttons?: React.ReactNode;
        children?: React.ReactNode;
    }) => React.createElement(
        'div',
        { 'data-testid': 'dialog' },
        props.dismissable === false ? null : React.createElement('button', { onClick: () => props.onCancel?.() }, 'X'),
        props.buttons,
        props.children),
}));

// PrimeReact 11's Stepper is compositional: each part renders its children.
vi.mock('primereact/stepper', () => {
    const part = (name: string) => {
        const Component = (props: { children?: React.ReactNode; style?: React.CSSProperties; value?: string }) =>
            React.createElement('div', { 'data-part': name, style: props.style, 'data-value': props.value }, props.children);
        Component.displayName = name;
        return Component;
    };
    return {
        Stepper: {
            Root: part('root'), List: part('list'), Step: part('step'),
            Header: part('header'), Number: part('number'), Title: part('title'),
            Separator: part('separator'), Panels: part('panels'), Panel: part('panel'),
        },
    };
});

// PrimeReact 11's Button takes its label as children, not a `label` prop.
vi.mock('primereact/button', () => ({
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
        command: TestCommand as unknown as new () => object,
        visible: true,
        title: 'Test Dialog',
        onCancel,
    },
    React.createElement(StepperPanel, { header: 'Only Step' }, 'Only Step content'));

// The footer is not the only way out of this dialog: the header carries an X that closes it through
// the same cancel arm. Withdrawing the footer Cancel while the command runs and leaving the X live
// would close a working dialog anyway - and then report cancellation for a command that goes on to
// succeed. The withdrawal is read as a window rather than as a state: the X is gone while the
// command runs and back once it returns, and the click it takes then is honored, so a dialog that
// simply never offered an X could not pass.
describe('when the header close is used on a wizard whose command has not returned', () => {
    let dialog: StepperDialogInTheDom;
    let offeredWhileRunning: string[];
    let offeredAfterReturning: string[];
    let cancelCallsAfterReturning: number;

    beforeEach(async () => {
        closeDialog.mockClear();
        onCancel.mockClear();
        anUnfinishedCommandRun();

        dialog = await render(aWizard());
        await click(dialog, 'Submit');
        offeredWhileRunning = buttonLabels(dialog);

        await click(dialog, 'X');

        await settle(() => execution.settle(aRejectedResult));
        offeredAfterReturning = buttonLabels(dialog);

        await click(dialog, 'X');
        cancelCallsAfterReturning = onCancel.mock.calls.length;
    });

    afterEach(async () => await unmount(dialog));

    it('should_withdraw_the_header_close_while_the_command_runs', () => {
        offeredWhileRunning.should.deep.equal(['Submit']);
    });

    it('should_offer_the_header_close_again_once_the_command_returns', () => {
        offeredAfterReturning.should.deep.equal(['X', 'Submit']);
    });

    it('should_honor_the_header_close_once_the_command_returns', () => {
        cancelCallsAfterReturning.should.equal(1);
    });
});
