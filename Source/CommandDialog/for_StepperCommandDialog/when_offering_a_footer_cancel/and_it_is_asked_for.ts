// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React from 'react';
import { vi } from 'vitest';
import { StepperPanel } from '../../StepperPanel';
import { StepperCommandDialog } from '../../StepperCommandDialog';
import {
    click,
    footerLayout,
    render,
    unmount,
    type StepperDialogInTheDom
} from '../given/a_stepper_dialog_in_the_dom';

vi.mock('../../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.buttons, props.children),
}));

// PrimeReact 11's Stepper is compositional: each part renders its children, and the step the
// wizard is on is no longer an `activeStep` prop — the Root is driven by `value`, the step's
// index as a string — so the Root part surfaces that value for the given helpers to read.
;


// PrimeReact 11's Button takes its label as children, not a `label` prop — the button's
// text content is what the given helpers read a button's label from.
vi.mock('../../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean; onClick?: () => void }) =>
        React.createElement('button', { disabled: props.disabled, onClick: props.onClick }, props.children),
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
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

const aWizardOfferingCancel = () => React.createElement(
    StepperCommandDialog<TestCommand>,
    {
        command: TestCommand as unknown as new () => object,
        visible: true,
        title: 'Test Dialog',
        showCancel: true,
    },
    step('Step 1'), step('Step 2'), step('Step 3'));

// Dismissal has to sit in the same place all the way through the wizard, or the user learns a
// position on step one that a later step takes away from them. Previous is the button that comes
// and goes, so the whole footer is described at each step: that pins the order Cancel keeps, and
// pins that Previous really did appear - an order proven only where nothing else moves proves
// nothing about moving. The spacer is described too, because on the first step there is no
// Previous, and without it "leads the footer" and "trails it" produce the same list of buttons.
describe('when a stepper dialog is asked for a footer cancel', () => {
    let dialog: StepperDialogInTheDom;
    let footerOnTheFirstStep: string[];
    let footerOnAMiddleStep: string[];
    let footerOnTheLastStep: string[];

    beforeEach(async () => {
        dialog = await render(aWizardOfferingCancel());
        footerOnTheFirstStep = footerLayout(dialog);

        await click(dialog, 'Next');
        footerOnAMiddleStep = footerLayout(dialog);

        await click(dialog, 'Next');
        footerOnTheLastStep = footerLayout(dialog);
    });

    afterEach(async () => await unmount(dialog));

    it('should_lead_the_footer_with_cancel_on_the_first_step', () => {
        footerOnTheFirstStep.should.deep.equal(['Cancel', 'spacer', 'Next']);
    });

    it('should_keep_cancel_leading_the_footer_once_previous_appears', () => {
        footerOnAMiddleStep.should.deep.equal(['Cancel', 'Previous', 'spacer', 'Next']);
    });

    it('should_keep_cancel_leading_the_footer_on_the_last_step', () => {
        footerOnTheLastStep.should.deep.equal(['Cancel', 'Previous', 'spacer', 'Submit']);
    });
});
