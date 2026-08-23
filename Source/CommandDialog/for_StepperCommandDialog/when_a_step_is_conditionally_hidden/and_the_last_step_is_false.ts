// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { StepperCommandDialog } from '../../StepperCommandDialog';
import { StepperPanel } from '../../StepperPanel';

vi.mock('../../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.buttons, props.children),
}));



vi.mock('../../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean }) =>
        React.createElement('button', { disabled: props.disabled }, props.children),
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
}));

vi.mock('@cratis/arc.react/commands', () => ({
    CommandForm: (props: { children?: React.ReactNode }) =>
        React.createElement('div', null, props.children),
    useCommandFormContext: () => ({
        isValid: true,
        setCommandValues: () => {},
        setCommandResult: () => {},
        getFieldError: () => undefined,
    }),
    useCommandInstance: () => ({}),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

class TestCommand {
    name: string = '';
}

const renderedPanels = (html: string) => html.split('data-part="panel"').length - 1;

// Exactly how a conditional step is written in an application: `{condition && <StepperPanel/>}`.
const showOptionalStep: boolean = false;

// The dialog opens on step 0, so a shape with a single rendered step puts the wizard on its
// last step immediately — which is where a step count inflated by the hidden step shows up.
describe('when the only hidden step is the last of two and the dialog is on the last rendered step', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(React.createElement(
            StepperCommandDialog<TestCommand>,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Dialog',
            },
            React.createElement(StepperPanel, { header: 'Step 1' }, 'Step 1 content'),
            showOptionalStep && React.createElement(StepperPanel, { header: 'Step 2' }, 'Step 2 content')
        ));
    });

    it('should_render_only_the_surviving_step', () => {
        renderedPanels(html).should.equal(1);
    });

    it('should_show_the_submit_button', () => {
        html.should.include('>Submit<');
    });

    it('should_not_show_the_next_button', () => {
        html.should.not.include('>Next<');
    });

    it('should_not_show_the_previous_button', () => {
        html.should.not.include('>Previous<');
    });
});

describe('when the hidden step is the last of three and the dialog is on the first of two rendered steps', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(React.createElement(
            StepperCommandDialog<TestCommand>,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Dialog',
            },
            React.createElement(StepperPanel, { header: 'Step 1' }, 'Step 1 content'),
            React.createElement(StepperPanel, { header: 'Step 2' }, 'Step 2 content'),
            showOptionalStep && React.createElement(StepperPanel, { header: 'Step 3' }, 'Step 3 content')
        ));
    });

    it('should_render_two_steps', () => {
        renderedPanels(html).should.equal(2);
    });

    it('should_show_the_next_button', () => {
        html.should.include('>Next<');
    });

    it('should_not_show_the_submit_button_yet', () => {
        html.should.not.include('>Submit<');
    });
});
