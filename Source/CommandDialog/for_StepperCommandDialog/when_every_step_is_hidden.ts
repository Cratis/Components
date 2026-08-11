// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React from 'react';
import { vi } from 'vitest';
import { StepperPanel } from 'primereact/stepperpanel';
import { StepperCommandDialog } from '../StepperCommandDialog';
import {
    activeStep,
    buttonLabels,
    render,
    rerender,
    renderedSteps,
    unmount,
    type StepperDialogInTheDom
} from './given/a_stepper_dialog_in_the_dom';

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

const aWizard = (...steps: (React.ReactElement | false)[]) => React.createElement(
    StepperCommandDialog<TestCommand>,
    {
        command: TestCommand as unknown as new () => object,
        visible: true,
        title: 'Test Dialog',
    },
    ...steps);

// Every step conditional and every condition false leaves a wizard with nothing to fill in. The
// command behind it is still valid, so the only sensible footer is the one that submits it — a
// Next button here leads nowhere at all, and no button at all is a dialog the user cannot finish.
describe('when every step is hidden', () => {
    let dialog: StepperDialogInTheDom;
    let stepsBeforeTheyVanished: string[];

    beforeEach(async () => {
        dialog = await render(aWizard(step('Step 1'), step('Step 2')));
        stepsBeforeTheyVanished = renderedSteps(dialog);

        await rerender(dialog, aWizard(false, false));
    });

    afterEach(async () => await unmount(dialog));

    it('should_have_rendered_both_steps_first', () => {
        stepsBeforeTheyVanished.should.deep.equal(['Step 1', 'Step 2']);
    });

    it('should_render_no_steps', () => {
        renderedSteps(dialog).should.have.lengthOf(0);
    });

    it('should_offer_submit', () => {
        buttonLabels(dialog).should.contain('Submit');
    });

    it('should_not_offer_next', () => {
        buttonLabels(dialog).should.not.contain('Next');
    });

    it('should_not_offer_previous', () => {
        buttonLabels(dialog).should.not.contain('Previous');
    });

    // Zero steps is the one count where the last index is negative, and the step handed to the
    // Stepper is what the panel shown, the validation state read and the buttons offered are all
    // derived from. Floored at the first step it stays a step a user could be on; unfloored it is
    // -1, an index no step ever answers to.
    it('should_hand_the_stepper_the_first_step', () => {
        activeStep(dialog).should.equal('0');
    });
});
