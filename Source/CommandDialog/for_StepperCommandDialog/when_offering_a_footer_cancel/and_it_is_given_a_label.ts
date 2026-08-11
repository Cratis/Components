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

const aWizardOfferingADiscard = () => React.createElement(
    StepperCommandDialog<TestCommand>,
    {
        command: TestCommand as unknown as new () => object,
        visible: true,
        title: 'Test Dialog',
        showCancel: true,
        cancelLabel: 'Discard',
        onCancel,
    },
    step('Step 1'), step('Step 2'));

// A wizard that throws work away wants to say so, so the label is the caller's. Renaming a button
// is only worth anything if the renamed button is still the one that cancels, so the label and the
// arm it takes are pinned together - a label the dialog forwarded to some other control would
// satisfy the first claim on its own.
describe('when a footer cancel is given a label of its own', () => {
    let dialog: StepperDialogInTheDom;
    let footerBeforeClicking: string[];

    beforeEach(async () => {
        closeDialog.mockClear();
        onCancel.mockClear();

        dialog = await render(aWizardOfferingADiscard());
        footerBeforeClicking = buttonLabels(dialog);

        await click(dialog, 'Discard');
    });

    afterEach(async () => await unmount(dialog));

    it('should_lead_the_footer_with_that_label', () => {
        footerBeforeClicking.should.deep.equal(['Discard', 'Next']);
    });

    it('should_still_invoke_the_cancel_callback_when_clicked', () => {
        onCancel.mock.calls.length.should.equal(1);
    });

    it('should_still_close_with_cancelled', () => {
        closeDialog.mock.calls[0][0].should.equal(4);
    });
});
