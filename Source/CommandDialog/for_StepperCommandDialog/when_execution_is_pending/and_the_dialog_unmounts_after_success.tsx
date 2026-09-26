// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { vi } from 'vitest';
import { StepperCommandDialog } from '../../StepperCommandDialog';
import { StepperPanel } from '../../StepperPanel';
import { render, unmount } from '../given/a_stepper_dialog_in_the_dom';

const state = vi.hoisted(() => ({
    execute: vi.fn<() => Promise<{ isSuccess: boolean; response: object }>>(),
    closeDialog: vi.fn(),
    submit: undefined as (() => void) | undefined,
}));
vi.mock('../../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', null, props.buttons, props.children),
}));
vi.mock('../../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean; onClick?: () => void }) => {
        state.submit = props.onClick;
        return React.createElement('button', { disabled: props.disabled, onClick: props.onClick }, props.children);
    },
}));
vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogResult: { Ok: 3, Cancelled: 4 }, useDialogContext: () => ({ closeDialog: state.closeDialog }),
}));
vi.mock('@cratis/arc.react/commands', () => {
    const context = { isValid: true, setCommandValues: () => undefined, setCommandResult: () => undefined, getFieldError: () => undefined };
    const command = { name: 'Example', execute: (...args: []) => state.execute(...args) };
    return {
        CommandForm: (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children),
        useCommandFormContext: () => context,
        useCommandInstance: () => command,
    };
});
class SampleCommand { name = 'Example'; }
const onConfirm = vi.fn(async () => true);
const onSuccess = vi.fn();

beforeEach(() => { state.execute.mockReset(); state.closeDialog.mockReset(); onConfirm.mockClear(); onSuccess.mockClear(); });

describe('when successful execution settles after the stepper dialog unmounts', () => {
    beforeEach(async () => {
        let resolveExecution!: (result: { isSuccess: boolean; response: object }) => void;
        state.execute.mockImplementation(() => new Promise(resolve => { resolveExecution = resolve; }));
        const dialog = await render(
            <StepperCommandDialog<SampleCommand> command={SampleCommand} title='Example' onConfirm={onConfirm} onSuccess={onSuccess}>
                <StepperPanel header='Only Step'>Example content</StepperPanel>
            </StepperCommandDialog>,
        );
        await act(async () => { state.submit!(); });
        await unmount(dialog);
        await act(async () => resolveExecution({ isSuccess: true, response: {} }));
    });
    it('should call the success callback', () => { onSuccess.mock.calls.length.should.equal(1); });
    it('should call onConfirm', () => { onConfirm.mock.calls.length.should.equal(1); });
    it('should close the dialog host with Ok', () => { state.closeDialog.mock.calls.should.deep.equal([[3]]); });
});

describe('when an async success callback outlives the stepper dialog', () => {
    beforeEach(async () => {
        state.execute.mockResolvedValue({ isSuccess: true, response: {} });
        let resolveSuccess!: () => void;
        onSuccess.mockImplementation(() => new Promise<void>(resolve => { resolveSuccess = resolve; }));
        const dialog = await render(
            <StepperCommandDialog<SampleCommand> command={SampleCommand} title='Example' onConfirm={onConfirm} onSuccess={onSuccess}>
                <StepperPanel header='Only Step'>Example content</StepperPanel>
            </StepperCommandDialog>,
        );
        await act(async () => { state.submit!(); });
        await unmount(dialog);
        await act(async () => resolveSuccess());
    });
    it('should call onConfirm', () => { onConfirm.mock.calls.length.should.equal(1); });
    it('should close the dialog host with Ok', () => { state.closeDialog.mock.calls.should.deep.equal([[3]]); });
});
