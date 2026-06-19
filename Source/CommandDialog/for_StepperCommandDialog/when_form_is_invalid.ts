// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';

const { commandFormValidity, executeCommand } = vi.hoisted(() => ({
    commandFormValidity: { isValid: true },
    executeCommand: vi.fn(async () => ({ isSuccess: true, isValid: true, validationResults: [] }))
}));

vi.mock('primereact/dialog', () => ({
    Dialog: (props: { footer?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', null, props.footer, props.children),
}));

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
        return React.createElement('div', { 'data-testid': 'stepper', 'data-active-step': props.activeStep }, children);
    },
}));

vi.mock('primereact/stepperpanel', () => {
    const MockStepperPanel = (props: { header?: string; children?: React.ReactNode; 'data-number-bg'?: string }) =>
        React.createElement('div', {
            'data-testid': 'stepper-panel',
            'data-header': props.header,
            'data-number-bg': props['data-number-bg'] ?? '',
        }, props.children);
    MockStepperPanel.displayName = 'StepperPanel';
    return { StepperPanel: MockStepperPanel };
});

vi.mock('primereact/button', () => ({
    Button: (props: { icon?: string; label?: string; onClick?: () => Promise<void> | void; disabled?: boolean; loading?: boolean }) => {
        if (props.icon === 'pi pi-check' && props.onClick && props.disabled !== true) {
            void props.onClick();
        }
        return React.createElement('button', { disabled: props.disabled, 'data-loading': props.loading }, props.label);
    },
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
        isValid: commandFormValidity.isValid,
        setCommandValues: () => {},
        setCommandResult: () => {},
        getFieldError: (fieldName: string) =>
            fieldName === 'name' ? 'Name is required' : undefined,
    }),
    useCommandInstance: () => ({ execute: executeCommand }),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

class TestCommand {
    name: string = '';
}

let StepperCommandDialog: typeof import('../StepperCommandDialog').StepperCommandDialog;
let StepperPanel: typeof import('primereact/stepperpanel').StepperPanel;

beforeEach(async () => {
    executeCommand.mockClear();
    vi.resetModules();
    StepperCommandDialog = (await import('../StepperCommandDialog')).StepperCommandDialog;
    StepperPanel = (await import('primereact/stepperpanel')).StepperPanel;
});

afterEach(() => {
    commandFormValidity.isValid = true;
});

describe('when StepperCommandDialog has an external isValid=false gate on the last step', () => {
    let html: string;

    beforeEach(() => {
        commandFormValidity.isValid = true;
        const element = React.createElement(
            StepperCommandDialog<TestCommand>,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Dialog',
                isValid: false,
            },
            React.createElement(StepperPanel, { header: 'Only Step' }, 'Content')
        );
        html = renderToStaticMarkup(element);
    });

    it('should_not_show_submit_button_when_externally_invalid', () => {
        html.should.not.include('>Submit<');
        executeCommand.should.not.have.been.called;
    });
});

describe('when StepperCommandDialog has an invalid command form on the last step', () => {
    let html: string;

    beforeEach(() => {
        commandFormValidity.isValid = false;
        const element = React.createElement(
            StepperCommandDialog<TestCommand>,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Dialog',
            },
            React.createElement(StepperPanel, { header: 'Only Step' }, 'Content')
        );
        html = renderToStaticMarkup(element);
    });

    it('should_not_show_submit_button_when_isValid_is_not_provided', () => {
        html.should.not.include('>Submit<');
        executeCommand.should.not.have.been.called;
    });
});

describe('when StepperCommandDialog has isValid=true and an invalid command form on the last step', () => {
    let html: string;

    beforeEach(() => {
        commandFormValidity.isValid = false;
        const element = React.createElement(
            StepperCommandDialog<TestCommand>,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Dialog',
                isValid: true,
            },
            React.createElement(StepperPanel, { header: 'Only Step' }, 'Content')
        );
        html = renderToStaticMarkup(element);
    });

    it('should_not_show_submit_button_when_command_form_is_invalid', () => {
        html.should.not.include('>Submit<');
        executeCommand.should.not.have.been.called;
    });
});

describe('when StepperCommandDialog has a valid command form on the last step', () => {
    let html: string;

    beforeEach(() => {
        commandFormValidity.isValid = true;
        const element = React.createElement(
            StepperCommandDialog<TestCommand>,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Dialog',
            },
            React.createElement(StepperPanel, { header: 'Only Step' }, 'Content')
        );
        html = renderToStaticMarkup(element);
    });

    it('should_show_submit_button_and_execute', () => {
        html.should.include('>Submit<');
        executeCommand.should.have.been.calledOnce;
    });
});
