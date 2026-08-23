// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';

vi.mock('../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement(
            'div',
            { 'data-testid': 'dialog' },
            props.buttons,
            props.children,
        ),
}));

// PrimeReact 11's Stepper is compositional: each part renders its children, and
// the Number part forwards its inline `style` so specs can assert the per-step
// red/green indicator the wrapper applies directly to each step's number.
;

vi.mock('../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean }) =>
        React.createElement('button', { disabled: props.disabled }, props.children),
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
}));

// isValid: true — only getFieldError drives the per-step indicator.
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

// A minimal CommandFormField stand-in with the correct displayName so that
// extractFieldNamesFromNode can identify it and extract the property name.
const FakeNameField = (props: { value?: (c: TestCommand) => unknown }) => {
    void props;
    return React.createElement('div', null);
};
FakeNameField.displayName = 'CommandFormField';

class TestCommand {
    name: string = '';
    description: string = '';
}

// The project runs specs with `isolate: false`, so module state and mocks are
// shared across files by execution order. Re-evaluate the component under this
// file's own mocks so the getFieldError stub (which drives the error color) is
// always the one in effect, regardless of which spec file ran first.
let StepperCommandDialog: typeof import('../StepperCommandDialog').StepperCommandDialog;
let StepperPanel: typeof import('../StepperPanel').StepperPanel;

describe('when a step contains a field with a validation error', () => {
    let html: string;

    beforeEach(async () => {
        vi.resetModules();
        StepperCommandDialog = (await import('../StepperCommandDialog'))
            .StepperCommandDialog;
        StepperPanel = (await import('../StepperPanel')).StepperPanel;

        const element = React.createElement(
            StepperCommandDialog<TestCommand>,
            {
                // SAFETY: The generated command proxy constructor is erased by this SSR harness only.
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Dialog',
            },
            React.createElement(
                StepperPanel,
                { header: 'Step 1' },
                React.createElement(FakeNameField, { value: (c: TestCommand) => c.name }),
            ),
            React.createElement(StepperPanel, { header: 'Step 2' }, 'No errors here'),
        );
        html = renderToStaticMarkup(element);
    });

    it('should_mark_the_invalid_step', () => {
        const steps = html.match(/<li[^>]*data-cratis-part="step"[^>]*>/g) ?? [];
        (steps[0] ?? '').should.include('data-invalid="true"');
    });

    it('should_not_mark_the_valid_step', () => {
        const steps = html.match(/<li[^>]*data-cratis-part="step"[^>]*>/g) ?? [];
        (steps[1] ?? '').should.not.include('data-invalid');
    });
});
