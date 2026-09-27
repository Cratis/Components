// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { CommandStepper } from '../../CommandStepper';
import { StepperPanel } from '../../StepperPanel';

const state = vi.hoisted(() => ({
    command: { name: 'Approved value', propertyDescriptors: [{ name: 'name' }], execute: vi.fn(async () => ({ isSuccess: true, response: {} })) },
}));
export { state };
vi.mock('../../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean; onClick?: () => void }) =>
        React.createElement('button', { disabled: props.disabled, onClick: props.onClick }, props.children),
}));
vi.mock('@cratis/arc.react/commands', () => ({
    CommandForm: (props: { children?: React.ReactNode; currentValues?: { name: string } }) => {
        if (props.currentValues) state.command.name = props.currentValues.name;
        return React.createElement('div', null, props.children);
    },
    useCommandFormContext: () => ({ isValid: true, setCommandValues: (values: { name: string }) => { state.command.name = values.name; }, setCommandResult: () => undefined }),
    useCommandInstance: () => state.command,
    CommandFormFieldWrapper: () => React.createElement('input', { 'aria-label': 'Name', value: state.command.name, onChange: () => undefined }),
}));
class SampleCommand { name = 'Approved value'; }
const NameField = (props: { value: (command: SampleCommand) => string }) => { void props; return null; };
NameField.displayName = 'CommandFormField';
export const onSuccess = vi.fn();
export const onFailed = vi.fn();
let container: HTMLDivElement;
let root: Root;
let guard: (values: SampleCommand) => Promise<boolean>;
const stepper = (name: string) => <CommandStepper<SampleCommand> command={SampleCommand}
    currentValues={{ name }} confirmBeforeExecute={guard} onSuccess={onSuccess} onFailed={onFailed}>
    <StepperPanel header='Details'><NameField value={(command) => command.name} /></StepperPanel>
</CommandStepper>;
export const mount = async (confirm: (values: SampleCommand) => Promise<boolean>) => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    guard = confirm;
    state.command.name = 'Approved value'; state.command.execute.mockClear(); onSuccess.mockClear(); onFailed.mockClear();
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(stepper('Approved value')));
};
export const submit = async () => {
    const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent === 'Submit');
    if (!button) throw new Error('Submit button missing');
    await act(async () => { button.click(); });
};
export const nameFieldDisabled = () => container.querySelector('input')?.matches(':disabled') ?? false;
export const changeValues = async () => { await act(async () => root.render(stepper('Changed while confirming'))); };
export const approve = async (resolve: (approved: boolean) => void) => { await act(async () => resolve(true)); };
export const unmount = async () => { await act(async () => root.unmount()); container.remove(); };
