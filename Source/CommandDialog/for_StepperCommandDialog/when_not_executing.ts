// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';

// StepperCommandDialog now composes the Cratis Dialog wrapper (not primereact/dialog
// directly) — render its custom footer (`buttons`) and body.
vi.mock('../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.buttons, props.children),
}));

// PrimeReact 11's Stepper is a set of compositional parts — each just renders its
// children so the footer/navigation behavior can be asserted.
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

// PrimeReact 11's Button renders its content as children (no label/loading props).
vi.mock('primereact/button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean }) =>
        React.createElement('button', { disabled: props.disabled }, props.children),
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
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
    description: string = '';
}

describe('when StepperCommandDialog is in its initial state', () => {
    let html: string;

    beforeEach(async () => {
        // The project runs specs with `isolate: false`, so a module imported by an
        // earlier spec file stays cached with that file's mocks bound in, and the
        // order files run in is not stable between runs. Re-evaluate under this
        // file's own mocks so this spec neither inherits another file's stubs nor
        // leaves its own behind — a static import here passes or fails by luck.
        vi.resetModules();
        const { StepperCommandDialog } = await import('../StepperCommandDialog');
        const { StepperPanel } = await import('../StepperPanel');

        const element = React.createElement(
            StepperCommandDialog<TestCommand>,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Stepper Dialog',
            },
            React.createElement(StepperPanel, { header: 'Step 1' }, 'Step 1 content'),
            React.createElement(StepperPanel, { header: 'Step 2' }, 'Step 2 content')
        );
        html = renderToStaticMarkup(element);
    });

    it('should_not_have_buttons_in_a_busy_state', () => {
        html.should.not.include('pi-spinner');
    });

    it('should_not_show_previous_button_on_first_step', () => {
        html.should.not.include('>Previous<');
    });

    it('should_show_next_button_on_first_step', () => {
        html.should.include('>Next<');
    });

    it('should_not_show_submit_button_on_first_step', () => {
        html.should.not.include('>Submit<');
    });

    it('should_not_show_cancel_button', () => {
        html.should.not.include('>Cancel<');
    });
});
