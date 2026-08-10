// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { StepperCommandDialog } from '../../StepperCommandDialog';
import { StepperPanel } from 'primereact/stepperpanel';

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
    Button: (props: { label?: string; disabled?: boolean }) =>
        React.createElement('button', { disabled: props.disabled }, props.label),
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

const renderedPanels = (html: string) => html.split('data-testid="stepper-panel"').length - 1;

const panel = (header: string) => React.createElement(StepperPanel, { header, key: header }, `${header} content`);

const renderDialog = (...children: React.ReactNode[]) => renderToStaticMarkup(React.createElement(
    StepperCommandDialog<TestCommand>,
    {
        command: TestCommand as unknown as new () => object,
        visible: true,
        title: 'Test Dialog',
    },
    ...children
));

const headersOf = (count: number) => Array.from({ length: count }, (_, index) => `Step ${index + 1}`);

// Nothing is hidden here — this pins the behavior a naive "subtract the falsy children" fix would break.
describe('when a map produces a single step and the dialog is on the last rendered step', () => {
    let html: string;

    beforeEach(() => {
        html = renderDialog(headersOf(1).map(panel));
    });

    it('should_render_only_the_surviving_steps', () => {
        renderedPanels(html).should.equal(1);
    });

    it('should_show_the_submit_button', () => {
        html.should.include('>Submit<');
    });

    it('should_not_show_the_next_button', () => {
        html.should.not.include('>Next<');
    });
});

describe('when a map produces three steps and the dialog is on the first rendered step', () => {
    let html: string;

    beforeEach(() => {
        html = renderDialog(headersOf(3).map(panel));
    });

    it('should_render_every_surviving_step', () => {
        renderedPanels(html).should.equal(3);
    });

    it('should_show_the_next_button', () => {
        html.should.include('>Next<');
    });

    it('should_not_show_the_submit_button_yet', () => {
        html.should.not.include('>Submit<');
    });
});
