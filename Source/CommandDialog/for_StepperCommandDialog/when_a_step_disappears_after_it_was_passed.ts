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
    click,
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

// The step set is not fixed once the wizard has opened: `{condition && <StepperPanel/>}` re-evaluates
// on every parent render, so a late-resolving query or a `currentValues` overlay can take a step away
// while the user is standing beyond it. The wizard then holds an index no step answers to.
describe('when a step disappears after it was passed', () => {
    let dialog: StepperDialogInTheDom;
    let stepBeforeItVanished: string;

    beforeEach(async () => {
        dialog = await render(aWizard(step('Step 1'), step('Step 2'), step('Step 3')));
        await click(dialog, 'Next');
        await click(dialog, 'Next');
        stepBeforeItVanished = activeStep(dialog);

        await rerender(dialog, aWizard(step('Step 1'), false, step('Step 3')));
    });

    afterEach(async () => await unmount(dialog));

    it('should_have_walked_the_user_onto_the_third_step_first', () => {
        stepBeforeItVanished.should.equal('2');
    });

    it('should_render_only_the_surviving_steps', () => {
        renderedSteps(dialog).should.deep.equal(['Step 1', 'Step 3']);
    });

    it('should_put_the_wizard_on_the_last_step_that_still_exists', () => {
        activeStep(dialog).should.equal('1');
    });

    it('should_offer_submit', () => {
        buttonLabels(dialog).should.contain('Submit');
    });

    it('should_not_offer_next', () => {
        buttonLabels(dialog).should.not.contain('Next');
    });

    // The index the dialog holds is one past the end, and Previous steps back from whatever it
    // holds. Stepping back from the stale index lands on the step already on screen, so the click
    // does nothing visible - once per step that vanished, before the wizard finally moves.
    it('should_move_the_wizard_when_previous_is_clicked', async () => {
        await click(dialog, 'Previous');

        activeStep(dialog).should.equal('0');
    });
});
