// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { CommandDialog } from '../../CommandDialog';

const state = vi.hoisted(() => ({
    confirm: undefined as (() => Promise<boolean>) | undefined,
    busy: false,
    execute: vi.fn(async () => ({ isSuccess: true, response: {} })),
    values: { name: 'Before' },
}));
export { state };

vi.mock('../../../Dialogs/Dialog', () => ({
    Dialog: (props: { onConfirm: () => Promise<boolean>; isBusy: boolean }) => {
        state.confirm = props.onConfirm;
        state.busy = props.isBusy;
        return React.createElement('div', { role: 'dialog' });
    },
}));
vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { OkCancel: 2 }, DialogResult: { Ok: 3 },
}));
vi.mock('@cratis/arc.react/commands', () => ({
    CommandForm: (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children),
    useCommandFormContext: () => ({ isValid: true, setCommandValues: (values: { name: string }) => { state.values = values; }, setCommandResult: () => undefined }),
    useCommandInstance: () => ({ ...state.values, execute: state.execute }),
    CommandFormFieldWrapper: () => null,
}));

export class SampleCommand { name = 'Before'; }
export const onSuccess = vi.fn();
export const onFailed = vi.fn();
export const onException = vi.fn();
export const onConfirm = vi.fn();
let root: Root;
let container: HTMLDivElement;

export const reset = () => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    state.execute.mockReset().mockResolvedValue({ isSuccess: true, response: {} });
    state.values = { name: 'Before' };
    onSuccess.mockReset(); onFailed.mockReset(); onException.mockReset(); onConfirm.mockReset();
};
export const mount = async (
    guard?: (values: SampleCommand) => boolean | Promise<boolean>,
    transform?: (values: SampleCommand) => SampleCommand | Promise<SampleCommand>,
) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(
        <CommandDialog<SampleCommand> command={SampleCommand} title='Example' confirmBeforeExecute={guard}
            onBeforeExecute={transform} onSuccess={onSuccess} onFailed={onFailed}
            onException={onException} onConfirm={onConfirm} />,
    ));
};
export const confirm = async (): Promise<boolean> => {
    if (!state.confirm) throw new Error('Confirm handler missing');
    let outcome = false;
    await act(async () => { outcome = await state.confirm!(); });
    return outcome;
};
export const unmount = async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
};
