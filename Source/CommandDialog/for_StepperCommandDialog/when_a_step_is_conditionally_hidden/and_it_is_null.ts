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

// PrimeReact 11's Stepper is compositional: each part renders its children, so the
// steps the wizard actually renders show up as one `data-part="panel"` element each.
vi.mock('primereact/stepper', () => {
    const part = (name: string) => {
        const Component = (props: { children?: React.ReactNode; style?: React.CSSProperties }) =>
            React.createElement('div', { 'data-part': name, style: props.style }, props.children);
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

const hiddenStep = null;

describe('when the last of two steps is null and the dialog is on the last rendered step', () => {
    let html: string;

    beforeEach(() => {
        html = renderDialog(panel('Step 1'), hiddenStep);
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

describe('when the last of three steps is null and the dialog is on the first rendered step', () => {
    let html: string;

    beforeEach(() => {
        html = renderDialog(panel('Step 1'), panel('Step 2'), hiddenStep);
    });

    it('should_render_every_surviving_step', () => {
        renderedPanels(html).should.equal(2);
    });

    it('should_show_the_next_button', () => {
        html.should.include('>Next<');
    });

    it('should_not_show_the_submit_button_yet', () => {
        html.should.not.include('>Submit<');
    });
});
