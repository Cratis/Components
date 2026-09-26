// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React, { act } from 'react';
import { vi } from 'vitest';
import { StepperCommandDialog } from '../../StepperCommandDialog';
import { StepperPanel } from '../../StepperPanel';
import { render, type StepperDialogInTheDom } from './a_stepper_dialog_in_the_dom';

const state = vi.hoisted(() => ({
    execute: vi.fn<() => Promise<{ isSuccess: boolean; response: object }>>(),
    closeDialog: vi.fn(),
    submit: undefined as (() => void) | undefined,
    busy: false,
}));
export { state };
vi.mock('../../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode; dismissable: boolean }) => {
        state.busy = !props.dismissable;
        return React.createElement('div', null, props.buttons, props.children);
    },
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
    const command = { name: 'Example', execute: () => state.execute() };
    return {
        CommandForm: (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children),
        useCommandFormContext: () => context,
        useCommandInstance: () => command,
    };
});
export class SampleCommand { name = 'Example'; }
export const onConfirm = vi.fn(async () => true);
export const onSuccess = vi.fn();
export const onFailed = vi.fn();
export const onClose = vi.fn(async () => true);
export const reset = () => {
    state.execute.mockReset(); state.closeDialog.mockReset();
    onConfirm.mockReset().mockResolvedValue(true);
    onClose.mockReset().mockResolvedValue(true);
    onSuccess.mockReset(); onFailed.mockReset();
};
export const mount = async (callbacks: { onConfirm?: typeof onConfirm; onClose?: typeof onClose; onSuccess?: typeof onSuccess; onFailed?: typeof onFailed } = {}): Promise<StepperDialogInTheDom> => render(
    <StepperCommandDialog<SampleCommand> command={SampleCommand} title='Example' {...callbacks}>
        <StepperPanel header='Only Step'>Example content</StepperPanel>
    </StepperCommandDialog>,
);
export const submit = async () => { await act(async () => { state.submit!(); }); };
