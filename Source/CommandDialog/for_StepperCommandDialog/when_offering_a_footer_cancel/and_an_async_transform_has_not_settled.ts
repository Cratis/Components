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

// `onBeforeExecute` may be async, so pressing Submit opens a window in which the dialog has
// committed to running the command but the request has not gone out yet. The spec owns the
// transform's promise so it can hold the dialog inside that window and act on it; `execution`
// counts the runs, because the whole question is whether a command the operator cancelled ran
// anyway.
const { execution } = vi.hoisted(() => ({ execution: { calls: 0 } }));

const { closeDialog } = vi.hoisted(() => ({ closeDialog: vi.fn() }));

vi.mock('../../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.buttons, props.children),
}));

// PrimeReact 11's Stepper is compositional: each part renders its children, and the step the
// wizard is on is no longer an `activeStep` prop — the Root is driven by `value`, the step's
// index as a string — so the Root part surfaces that value for the given helpers to read.
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


// PrimeReact 11's Button takes its label as children, not a `label` prop — the button's
// text content is what the given helpers read a button's label from.
vi.mock('primereact/button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean; onClick?: () => void }) =>
        React.createElement('button', { disabled: props.disabled, onClick: props.onClick }, props.children),
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => ({ closeDialog }),
}));

// The context object is created once rather than per call: this spec renders for real, so an
// identity that changed on every render would re-run the stepper's error effect forever. The
// command settles immediately and rejected - the delay under test is the transform's, and a
// rejected result keeps the dialog open so the state after the window is still observable.
vi.mock('@cratis/arc.react/commands', () => {
    const commandFormContext = {
        isValid: true,
        setCommandValues: () => { },
        setCommandResult: () => { },
        getFieldError: () => undefined,
    };
    const commandInstance = {
        name: '',
        execute: () => {
            execution.calls += 1;
            return Promise.resolve({ isSuccess: false, isValid: true });
        },
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

const transform: { settle: (values: TestCommand) => void; promise: Promise<TestCommand> } = {
    settle: () => { },
    promise: Promise.resolve(new TestCommand()),
};

/** Arms a fresh transform that will not hand back values until the spec says so. */
const aTransformThatHasNotSettled = () => {
    transform.promise = new Promise<TestCommand>(resolve => {
        transform.settle = resolve;
    });
};

const onCancel = vi.fn(() => true);
const onBeforeExecute = vi.fn(() => transform.promise);

const aWizardOfferingCancel = () => React.createElement(
    StepperCommandDialog<TestCommand>,
    {
        command: TestCommand as unknown as new () => object,
        visible: true,
        title: 'Test Dialog',
        showCancel: true,
        onCancel,
        onBeforeExecute,
    },
    React.createElement(StepperPanel, { header: 'Only Step' }, 'Only Step content'));

// The dangerous cell of the state machine: submit committed, command not yet sent. A Cancel honored
// here is a lie - the dialog reports cancellation, the transform then resolves, and the write lands
// regardless. Which is why the spec does not stop at "Cancel did nothing": it settles the transform
// and reads that the command really did run, so the silence from the dialog context is measured
// against a run that happened rather than against a submit that quietly went nowhere.
describe('when cancel is clicked while an async before-execute transform is still running', () => {
    let dialog: StepperDialogInTheDom;
    let footerWhileTransforming: string[];
    let executeCallsWhileTransforming: number;
    let closeDialogCallsWhileTransforming: number;
    let executeCallsAfterSettling: number;
    let cancelCallsAfterSettling: number;

    beforeEach(async () => {
        closeDialog.mockClear();
        onCancel.mockClear();
        onBeforeExecute.mockClear();
        execution.calls = 0;
        aTransformThatHasNotSettled();

        dialog = await render(aWizardOfferingCancel());
        await click(dialog, 'Submit');
        footerWhileTransforming = buttonLabels(dialog);
        executeCallsWhileTransforming = execution.calls;

        await click(dialog, 'Cancel');
        closeDialogCallsWhileTransforming = closeDialog.mock.calls.length;

        await settle(() => transform.settle(new TestCommand()));
        executeCallsAfterSettling = execution.calls;

        await click(dialog, 'Cancel');
        cancelCallsAfterSettling = onCancel.mock.calls.length;
    });

    afterEach(async () => await unmount(dialog));

    it('should_still_render_a_cancel_to_click', () => {
        footerWhileTransforming.should.deep.equal(['Cancel', 'Submit']);
    });

    it('should_not_have_run_the_command_yet', () => {
        executeCallsWhileTransforming.should.equal(0);
    });

    it('should_report_no_cancellation_to_the_dialog_context', () => {
        closeDialogCallsWhileTransforming.should.equal(0);
    });

    it('should_run_the_command_the_submit_committed_to', () => {
        executeCallsAfterSettling.should.equal(1);
    });

    it('should_honor_a_cancel_click_once_the_command_returns', () => {
        cancelCallsAfterSettling.should.equal(1);
    });
});
