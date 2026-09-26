// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { CommandStepper, type CommandStepperProps } from '../../CommandStepper';
import { StepperPanel } from '../../StepperPanel';

export class SampleCommand {
    name = '';
}

const execution = vi.hoisted(() => ({
    calls: 0,
    pending: undefined as Promise<unknown> | undefined,
    result: {
        isSuccess: false,
        isValid: true,
        isAuthorized: true,
        hasExceptions: false,
        exceptionMessages: ['Example exception'],
        exceptionStackTrace: 'Example stack trace',
        validationResults: [],
    },
}));

export { execution };

const validation = vi.hoisted(() => ({ invalid: false }));
export { validation };
export const onChangeStep = vi.fn();

const NameField = (props: { value: (command: SampleCommand) => unknown }) => {
    void props;
    return null;
};
NameField.displayName = 'CommandFormField';

vi.mock('../../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean; onClick?: () => void }) =>
        React.createElement('button', { disabled: props.disabled, onClick: props.onClick }, props.children),
}));

vi.mock('@cratis/arc.react/commands', () => {
    const commandFormContext = {
        isValid: true,
        setCommandValues: () => { },
        setCommandResult: () => { },
        getFieldError: (name: string) => name === 'name' && validation.invalid ? 'Required' : undefined,
    };
    const commandInstance = {
        name: '',
        execute: () => {
            execution.calls += 1;
            return execution.pending ?? Promise.resolve(execution.result);
        },
    };

    return {
        CommandForm: (props: { children?: React.ReactNode }) =>
            React.createElement('div', null, props.children),
        useCommandFormContext: () => commandFormContext,
        useCommandInstance: () => commandInstance,
        CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
            React.createElement('div', null, props.field),
    };
});

export interface InlineStepperInTheDom {
    container: HTMLDivElement;
    root: Root;
}

export const render = async (
    props: Omit<CommandStepperProps<SampleCommand>, 'command' | 'children'> = {},
    children: React.ReactNode = React.createElement(StepperPanel, { header: 'Only Step' }, 'Example content'),
): Promise<InlineStepperInTheDom> => {
    // SAFETY: React's test-environment flag is absent from DOM typings.
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
        root.render(React.createElement(
            CommandStepper<SampleCommand>,
            { command: SampleCommand as unknown as new () => object, ...props },
            children,
        ));
    });
    return { container, root };
};

export const renderNavigation = (linear = true) => render(
    { linear, onChangeStep },
    [React.createElement(StepperPanel, { header: 'First', key: 'first' },
        React.createElement(NameField, { value: (command) => command.name })),
    React.createElement(StepperPanel, { header: 'Second', key: 'second' }, 'Second content')],
);

export const click = async (stepper: InlineStepperInTheDom, label: string) => {
    const button = Array.from(stepper.container.querySelectorAll('button'))
        .find((candidate) => candidate.querySelector('[data-cratis-part="title"]')?.textContent === label || candidate.textContent === label);
    if (!button) throw new Error('Navigation button missing');
    await act(async () => button.click());
};

export const activeStep = (stepper: InlineStepperInTheDom) =>
    stepper.container.querySelector('[data-cratis-part="root"]')?.getAttribute('data-value');

export const submitButton = (stepper: InlineStepperInTheDom): HTMLButtonElement => {
    const button = Array.from(stepper.container.querySelectorAll('button'))
        .find((candidate) => candidate.textContent === 'Submit');
    if (!button) throw new Error('Submit button not rendered');
    return button;
};

export const submit = async (stepper: InlineStepperInTheDom) => {
    await act(async () => {
        submitButton(stepper).click();
    });
};

export const unmount = async (stepper: InlineStepperInTheDom) => {
    await act(async () => stepper.root.unmount());
    stepper.container.remove();
};
