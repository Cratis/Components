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

const stepStateOf = (html: string, header: string) =>
    (html.match(/<li[^>]*data-cratis-part="step"[^>]*>[\s\S]*?<\/li>/g) ?? []).find(
        (step) => step.includes(`>${header}</span>`),
    ) ?? '';

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
        stepStateOf(html, 'Contact').should.not.include('data-invalid');
    });

    it('should_mark_the_step_whose_own_field_has_an_error', () => {
        stepStateOf(html, 'Details').should.include('data-invalid="true"');
    });

    it('should_show_the_next_button_on_the_first_of_two_steps', () => {
        html.should.include('>Next<');
    });

    it('should_not_show_the_submit_button_yet', () => {
        html.should.not.include('>Submit<');
    });
});
