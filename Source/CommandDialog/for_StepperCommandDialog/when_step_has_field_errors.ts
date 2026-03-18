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

// Simulate PrimeReact's Stepper: invoke pt.stepperpanel.number for each child and
// attach the resulting backgroundColor as data-number-bg so specs can assert on it.
vi.mock('primereact/stepper', () => ({
    Stepper: (props: { children?: React.ReactNode; pt?: Record<string, unknown>; activeStep?: number }) => {
        type StepCtx = { context: { index: number } };
        type NumberPtFn = (opts: StepCtx) => { style?: { backgroundColor?: string } };
        const ptStepperpanel = (props.pt as Record<string, unknown> | undefined)?.stepperpanel as Record<string, unknown> | undefined;
        const numberPtFn = ptStepperpanel?.number as NumberPtFn | undefined;
        const children = React.Children.map(props.children, (child, index) => {
            if (!React.isValidElement(child)) return child;
            const result = typeof numberPtFn === 'function' ? numberPtFn({ context: { index } }) : {};
            const bg = result?.style?.backgroundColor ?? '';
            return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, { 'data-number-bg': bg });
        });
        return React.createElement('div', { 'data-testid': 'stepper' }, children);
    },
}));

// Set displayName so the indicator code path in processChildren is triggered.
// Forward data-number-bg (injected by the Stepper mock above) so specs can assert on it.
vi.mock('primereact/stepperpanel', () => {
    const MockStepperPanel = (props: {
        header?: string;
        children?: React.ReactNode;
        'data-number-bg'?: string;
    }) =>
        React.createElement('div', {
            'data-testid': 'stepper-panel',
            'data-header': props.header,
            'data-number-bg': props['data-number-bg'] ?? '',
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
        // Step 1 has a field error — its number circle should have the red error background
        const step1Match = html.match(/data-header="Step 1"[^>]*data-number-bg="([^"]*)"/);
        const step1Bg = step1Match?.[1] ?? '';
        step1Bg.should.include('red');
    });

    it('should_not_mark_the_valid_step_with_error_class', () => {
        // Step 2 has no field errors — its number circle should not have the red error background
        const step2Match = html.match(/data-header="Step 2"[^>]*data-number-bg="([^"]*)"/);
        const step2Bg = step2Match?.[1] ?? '';
        step2Bg.should.not.include('red');
    });
});
