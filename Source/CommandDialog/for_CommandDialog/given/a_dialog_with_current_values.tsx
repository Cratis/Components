// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { CommandDialog } from '../../CommandDialog';

const state = vi.hoisted(() => ({
    confirm: undefined as (() => Promise<boolean>) | undefined,
    command: { name: 'Approved value', propertyDescriptors: [{ name: 'name' }], execute: vi.fn(async () => ({ isSuccess: true, response: {} })) },
}));
export { state };

vi.mock('../../../Dialogs/Dialog', () => ({
    Dialog: (props: { onConfirm: () => Promise<boolean> }) => {
        state.confirm = props.onConfirm;
        return React.createElement('div', { role: 'dialog' });
    },
}));
vi.mock('@cratis/arc.react/dialogs', () => ({ DialogButtons: { OkCancel: 2 }, DialogResult: { Ok: 3 } }));
vi.mock('@cratis/arc.react/commands', () => ({
    CommandForm: (props: { children?: React.ReactNode; currentValues?: { name: string } }) => {
        if (props.currentValues) state.command.name = props.currentValues.name;
        return React.createElement('div', null, props.children);
    },
    useCommandFormContext: () => ({ isValid: true, setCommandValues: (values: { name: string }) => { state.command.name = values.name; }, setCommandResult: () => undefined }),
    useCommandInstance: () => state.command,
    CommandFormFieldWrapper: () => null,
}));

class SampleCommand { name = 'Approved value'; }
export const onSuccess = vi.fn();
export const onFailed = vi.fn();
let container: HTMLDivElement;
let root: Root;
let guard: (values: SampleCommand) => Promise<boolean>;
let transform: ((values: SampleCommand) => SampleCommand) | undefined;
const dialog = (name: string) => <CommandDialog<SampleCommand> command={SampleCommand} title='Example'
    currentValues={{ name }} confirmBeforeExecute={guard} onBeforeExecute={transform} onSuccess={onSuccess} onFailed={onFailed} />;

export const mount = async (confirm: (values: SampleCommand) => Promise<boolean>, beforeExecute?: (values: SampleCommand) => SampleCommand) => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    guard = confirm;
    transform = beforeExecute;
    state.command.name = 'Approved value';
    state.command.execute.mockClear(); onSuccess.mockClear(); onFailed.mockClear();
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(dialog('Approved value')));
};
export const submit = async () => { await act(async () => { void state.confirm!(); }); };
export const changeValues = async () => { await act(async () => root.render(dialog('Changed while confirming'))); };
export const approve = async (resolve: (approved: boolean) => void) => { await act(async () => resolve(true)); };
export const unmount = async () => { await act(async () => root.unmount()); container.remove(); };
