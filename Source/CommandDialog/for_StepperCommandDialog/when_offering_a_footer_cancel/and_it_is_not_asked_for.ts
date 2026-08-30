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

const aWizardWithoutACancelProp = () => React.createElement(
    StepperCommandDialog<TestCommand>,
    {
        command: TestCommand as unknown as new () => object,
        visible: true,
        title: 'Test Dialog',
    },
    step('Step 1'), step('Step 2'), step('Step 3'));

// The footer cancel is opt-in, so the wizard that never mentions it must look exactly as it did
// before the prop existed. Each step is described by the whole footer - spacer included - rather
// than by the absence of one label: a dialog whose footer rendered nothing at all also has no
// Cancel in it, and that is a worse bug than the one being guarded against.
describe('when a stepper dialog is never asked for a footer cancel', () => {
    let dialog: StepperDialogInTheDom;
    let footerOnTheFirstStep: string[];
    let footerOnAMiddleStep: string[];
    let footerOnTheLastStep: string[];

    beforeEach(async () => {
        dialog = await render(aWizardWithoutACancelProp());
        footerOnTheFirstStep = footerLayout(dialog);

        await click(dialog, 'Next');
        footerOnAMiddleStep = footerLayout(dialog);

        await click(dialog, 'Next');
        footerOnTheLastStep = footerLayout(dialog);
    });

    afterEach(async () => await unmount(dialog));

    it('should_offer_next_alone_on_the_first_step', () => {
        footerOnTheFirstStep.should.deep.equal(['spacer', 'Next']);
    });

    it('should_offer_previous_and_next_alone_on_a_middle_step', () => {
        footerOnAMiddleStep.should.deep.equal(['Previous', 'spacer', 'Next']);
    });

    it('should_offer_previous_and_submit_alone_on_the_last_step', () => {
        footerOnTheLastStep.should.deep.equal(['Previous', 'spacer', 'Submit']);
    });
});
