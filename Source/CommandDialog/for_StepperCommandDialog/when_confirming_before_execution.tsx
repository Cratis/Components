// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React from 'react';
import { vi } from 'vitest';
import { StepperPanel } from '../StepperPanel';
import { StepperCommandDialog } from '../StepperCommandDialog';
import { click, disabledButtonLabels, render, unmount, type StepperDialogInTheDom } from './given/a_stepper_dialog_in_the_dom';

const execution = vi.hoisted(() => ({ calls: 0 }));
const closeDialog = vi.hoisted(() => vi.fn());
vi.mock('../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.buttons, props.children),
}));
vi.mock('../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean; onClick?: () => void }) =>
        React.createElement('button', { disabled: props.disabled, onClick: props.onClick }, props.children),
}));
vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogResult: { Ok: 3, Cancelled: 4 }, useDialogContext: () => ({ closeDialog }),
}));
vi.mock('@cratis/arc.react/commands', () => {
    const context = { isValid: true, setCommandValues: () => undefined, setCommandResult: () => undefined, getFieldError: () => undefined };
    const command = { name: 'Example', execute: async () => { execution.calls++; return { isSuccess: true, response: {} }; } };
    return {
        CommandForm: (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children),
        useCommandFormContext: () => context,
        useCommandInstance: () => command,
        CommandFormFieldWrapper: () => null,
    };
});
class SampleCommand { name = 'Example'; }

const guard = vi.fn(async () => false);
const onSuccess = vi.fn();
const onFailed = vi.fn();
describe('when confirming a stepper dialog submission', () => {
    let dialog: StepperDialogInTheDom;
    let declinedCalls: number;
    let closeCallsAfterDecline: number;
    let approvedCalls: number;
    let enabledAfterDecline: boolean;
    beforeEach(async () => {
        execution.calls = 0;
        closeDialog.mockClear(); onSuccess.mockClear(); onFailed.mockClear();
        guard.mockClear().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        dialog = await render(
            <StepperCommandDialog<SampleCommand> command={SampleCommand} title='Example'
                confirmBeforeExecute={guard} onSuccess={onSuccess} onFailed={onFailed}>
                <StepperPanel header='Only Step'>Example content</StepperPanel>
            </StepperCommandDialog>,
        );
        await click(dialog, 'Submit');
        declinedCalls = execution.calls;
        closeCallsAfterDecline = closeDialog.mock.calls.length;
        enabledAfterDecline = !disabledButtonLabels(dialog).includes('Submit');
        await click(dialog, 'Submit');
        approvedCalls = execution.calls;
    });
    afterEach(async () => await unmount(dialog));
    it('should not execute or close on decline', () => {
        declinedCalls.should.equal(0);
        closeCallsAfterDecline.should.equal(0);
        onFailed.mock.calls.length.should.equal(0);
    });
    it('should release busy state after decline', () => { enabledAfterDecline.should.equal(true); });
    it('should execute on approval', () => { approvedCalls.should.equal(1); });
});
