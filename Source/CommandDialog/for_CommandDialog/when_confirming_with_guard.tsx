// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CommandDialog } from '../CommandDialog';

const state = vi.hoisted(() => ({
    confirm: undefined as (() => Promise<boolean>) | undefined,
    busy: false,
    execute: vi.fn(async () => ({ isSuccess: true, response: {} })),
    values: { name: 'Before' },
}));

vi.mock('../../Dialogs/Dialog', () => ({
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

class SampleCommand { name = 'Before'; }

const onSuccess = vi.fn();
const onFailed = vi.fn();
const onException = vi.fn();
const onConfirm = vi.fn();
let root: Root;
let container: HTMLDivElement;
const mount = async (guard: (values: SampleCommand) => boolean | Promise<boolean>, transform?: (values: SampleCommand) => SampleCommand) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(
        <CommandDialog<SampleCommand> command={SampleCommand} title='Example' confirmBeforeExecute={guard}
            onBeforeExecute={transform} onSuccess={onSuccess} onFailed={onFailed}
            onException={onException} onConfirm={onConfirm} />,
    ));
};

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    state.execute.mockClear();
    state.values = { name: 'Before' };
    onSuccess.mockClear(); onFailed.mockClear(); onException.mockClear(); onConfirm.mockClear();
});
afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
});

describe('when confirming with a pre-execution guard that approves', () => {
    let receivedValues: SampleCommand | undefined;
    beforeEach(async () => {
        await mount((values) => { receivedValues = values; return true; }, () => ({ name: 'After' }));
        await act(async () => { await state.confirm?.(); });
    });
    it('should receive the transformed values', () => { receivedValues?.name.should.equal('After'); });
    it('should execute once', () => { state.execute.mock.calls.length.should.equal(1); });
});

describe('when confirming with a pre-execution guard that declines', () => {
    let close: boolean | undefined;
    beforeEach(async () => {
        await mount(() => false);
        await act(async () => { close = await state.confirm?.(); });
    });
    it('should keep the dialog open', () => { close?.should.equal(false); });
    it('should not execute', () => { state.execute.mock.calls.length.should.equal(0); });
    it('should not call result or close callbacks', () => {
        onSuccess.mock.calls.length.should.equal(0);
        onFailed.mock.calls.length.should.equal(0);
        onConfirm.mock.calls.length.should.equal(0);
    });
    it('should release busy state', () => { state.busy.should.equal(false); });
});

describe('when a guard is pending and another confirm is requested', () => {
    let resolveGuard: (approved: boolean) => void;
    let busyWhilePending: boolean;
    let executeCalls: number;
    beforeEach(async () => {
        const pending = new Promise<boolean>((resolve) => { resolveGuard = resolve; });
        await mount(() => pending);
        await act(async () => { void state.confirm?.(); });
        busyWhilePending = state.busy;
        await act(async () => { void state.confirm?.(); });
        await act(async () => resolveGuard(true));
        executeCalls = state.execute.mock.calls.length;
    });
    it('should hold busy through confirmation', () => { busyWhilePending.should.equal(true); });
    it('should execute only once', () => { executeCalls.should.equal(1); });
});

describe('when a pending guard rejects', () => {
    let rejectGuard: (error: Error) => void;
    let busyWhilePending: boolean;
    beforeEach(async () => {
        const pending = new Promise<boolean>((_resolve, reject) => { rejectGuard = reject; });
        await mount(() => pending);
        await act(async () => { void state.confirm?.(); });
        busyWhilePending = state.busy;
        await act(async () => rejectGuard(new Error('Example failure')));
    });
    it('should be busy until rejection', () => { busyWhilePending.should.equal(true); });
    it('should release busy', () => { state.busy.should.equal(false); });
    it('should report through onException', () => { onException.mock.calls[0][0].should.deep.equal(['Example failure']); });
    it('should stay open and not execute', () => {
        state.execute.mock.calls.length.should.equal(0);
        onSuccess.mock.calls.length.should.equal(0);
        onFailed.mock.calls.length.should.equal(0);
    });
});

describe('when unmounting while the guard is pending', () => {
    let resolveGuard: (approved: boolean) => void;
    beforeEach(async () => {
        const pending = new Promise<boolean>((resolve) => { resolveGuard = resolve; });
        await mount(() => pending);
        await act(async () => { void state.confirm?.(); });
        await act(async () => root.unmount());
        await act(async () => resolveGuard(true));
    });
    it('should not execute after unmount', () => { state.execute.mock.calls.length.should.equal(0); });
});
