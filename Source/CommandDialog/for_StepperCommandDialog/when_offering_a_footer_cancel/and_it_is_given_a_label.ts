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
