// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { StepperCommandDialog } from '../../StepperCommandDialog';
import { StepperPanel } from '../../StepperPanel';

vi.mock('../../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement(
            'div',
            { 'data-testid': 'dialog' },
            props.buttons,
            props.children,
        ),
}));

// PrimeReact 11's Stepper is compositional: each part renders its children, and the
// Number part forwards the inline `style` the wrapper computes for each step — which
// is where the red / green indicator now lives (v10 read it off pt.stepperpanel.number).
vi.mock('primereact/stepper', () => {
    const part = (name: string) => {
        const Component = (props: {
            children?: React.ReactNode;
            style?: React.CSSProperties;
        }) =>
            React.createElement(
                'div',
                { 'data-part': name, style: props.style },
                props.children,
            );
        Component.displayName = name;
        return Component;
    };
    return {
        Stepper: {
            Root: part('root'),
            List: part('list'),
            Step: part('step'),
            Header: part('header'),
            Number: part('number'),
            Title: part('title'),
            Separator: part('separator'),
            Panels: part('panels'),
            Panel: part('panel'),
        },
    };
});

// PrimeReact 11's Button takes its label as children, not a `label` prop.
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
        getFieldError: (fieldName: string) =>
            fieldName === 'name' ? 'Name is required' : undefined,
    }),
    useCommandInstance: () => ({}),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

class TestCommand {
    name: string = '';
    description: string = '';
}

// A stand-in for a CommandForm field — the displayName is what the field-name extraction keys on.
const NameField = (props: { value?: (command: TestCommand) => unknown }) => {
    void props;
    return React.createElement('div', null);
};
NameField.displayName = 'CommandFormField';

// The step number and its title are siblings inside the step header, so the number
// belonging to a named step is the one immediately preceding that step's title.
const numberBackgroundOf = (html: string, header: string) =>
    html.match(
        new RegExp(
            `<span(?=[^>]*data-part="number")([^>]*)>[^<]*</span><span(?=[^>]*data-part="title")[^>]*>${header}</span>`,
        ),
    )?.[1] ?? '';

// Exactly how a conditional step is written in an application: `{condition && <StepperPanel/>}`.
const showOptionalStep: boolean = false;

describe('when the hidden step sits between two rendered steps', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(
            React.createElement(
                StepperCommandDialog<TestCommand>,
                {
                    // SAFETY: The generated command proxy constructor is erased by this SSR harness only.
                    command: TestCommand as unknown as new () => object,
                    visible: true,
                    title: 'Test Dialog',
                },
                React.createElement(
                    StepperPanel,
                    { header: 'Contact', key: 'contact' },
                    'No fields here',
                ),
                showOptionalStep &&
                    React.createElement(
                        StepperPanel,
                        { header: 'Optional', key: 'optional' },
                        'Hidden',
                    ),
                React.createElement(
                    StepperPanel,
                    { header: 'Details', key: 'details' },
                    React.createElement(NameField, {
                        value: (command: TestCommand) => command.name,
                    }),
                ),
            ),
        );
    });

    it('should_render_only_the_two_surviving_steps', () => {
        html.split('data-part="panel"').length.should.equal(3);
    });

    it('should_not_mark_the_step_without_field_errors', () => {
        numberBackgroundOf(html, 'Contact').should.not.include('red');
    });

    it('should_mark_the_step_whose_own_field_has_an_error', () => {
        numberBackgroundOf(html, 'Details').should.include('red');
    });

    it('should_show_the_next_button_on_the_first_of_two_steps', () => {
        html.should.include('>Next<');
    });

    it('should_not_show_the_submit_button_yet', () => {
        html.should.not.include('>Submit<');
    });
});
