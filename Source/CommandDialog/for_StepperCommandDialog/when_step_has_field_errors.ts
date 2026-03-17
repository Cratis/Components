// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { StepperCommandDialog } from '../StepperCommandDialog';
import { StepperPanel } from 'primereact/stepperpanel';

vi.mock('primereact/dialog', () => ({
    Dialog: (props: { footer?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.footer, props.children),
}));

vi.mock('primereact/stepper', () => ({
    Stepper: (props: { children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'stepper' }, props.children),
}));

// Set displayName so the indicator code path in processChildren is triggered.
// Expose pt.header.className as data-header-class so specs can assert on it.
vi.mock('primereact/stepperpanel', () => {
    const MockStepperPanel = (props: {
        header?: string;
        children?: React.ReactNode;
        pt?: { header?: { className?: string } };
    }) =>
        React.createElement('div', {
            'data-testid': 'stepper-panel',
            'data-header': props.header,
            'data-header-class': props.pt?.header?.className ?? '',
        }, props.children);
    MockStepperPanel.displayName = 'StepperPanel';
    return { StepperPanel: MockStepperPanel };
});

vi.mock('primereact/button', () => ({
    Button: (props: { label?: string; disabled?: boolean; loading?: boolean }) =>
        React.createElement('button', { disabled: props.disabled, 'data-loading': props.loading }, props.label),
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
}));

// isValid: true — only getFieldError drives the per-step indicator; keeps isValid
// consistent with other test files to avoid mock-bleed issues (isolate: false).
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

describe('when a step contains a field with a validation error', () => {
    let html: string;

    beforeEach(() => {
        const element = React.createElement(
            StepperCommandDialog<TestCommand>,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Dialog',
            },
            React.createElement(
                StepperPanel,
                { header: 'Step 1' },
                React.createElement(FakeNameField, { value: (c: TestCommand) => c.name })
            ),
            React.createElement(StepperPanel, { header: 'Step 2' }, 'No errors here')
        );
        html = renderToStaticMarkup(element);
    });

    it('should_mark_the_invalid_step_with_error_class', () => {
        html.should.include('scd-step-invalid');
    });

    it('should_not_mark_the_valid_step_with_error_class', () => {
        // The second panel (Step 2) has no field errors — its data-header-class should be empty
        const step2Match = html.match(/data-header="Step 2"[^>]*data-header-class="([^"]*)"/);
        const step2Class = step2Match?.[1] ?? '';
        step2Class.should.not.include('scd-step-invalid');
    });
});
