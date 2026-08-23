// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';

const { commandFormValidity, executeCommand } = vi.hoisted(() => ({
    commandFormValidity: { isValid: true },
    executeCommand: vi.fn(async () => ({ isSuccess: true, isValid: true, validationResults: [] }))
}));

vi.mock('../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', null, props.buttons, props.children),
}));

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

// The submit button is the only one carrying autoFocus — auto-activate it (when
// enabled) so the spec can assert whether the command executes.
vi.mock('../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; onClick?: () => Promise<void> | void; disabled?: boolean; autoFocus?: boolean }) => {
        if (props.autoFocus && props.onClick && props.disabled !== true) {
            void props.onClick();
        }
        return React.createElement('button', { disabled: props.disabled }, props.children);
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
let StepperPanel: typeof import('../StepperPanel').StepperPanel;

beforeEach(async () => {
    executeCommand.mockClear();
    vi.resetModules();
    StepperCommandDialog = (await import('../StepperCommandDialog')).StepperCommandDialog;
    StepperPanel = (await import('../StepperPanel')).StepperPanel;
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
