// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React from 'react';
import { expect } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { StepperPanel } from '../StepperPanel';
import { StepperCommandDialog } from '../StepperCommandDialog';
import {
    buttonLabels,
    render,
    unmount,
    type StepperDialogInTheDom,
} from './given/a_stepper_dialog_in_the_dom';

vi.mock('../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.buttons, props.children),
}));

vi.mock('../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean; onClick?: () => void }) =>
        React.createElement('button', { disabled: props.disabled, onClick: props.onClick }, props.children),
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
}));

vi.mock('@cratis/arc.react/commands', () => {
    const commandFormContext = {
        isValid: true,
        setCommandValues: () => undefined,
        setCommandResult: () => undefined,
        getFieldError: () => undefined,
    };

    return {
        CommandForm: (props: { children?: React.ReactNode }) =>
            React.createElement('div', null, props.children),
        useCommandFormContext: () => commandFormContext,
        useCommandInstance: () => ({}),
        CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
            React.createElement('div', null, props.field),
    };
});

class TestCommand {
    name: string = '';
}

/**
 * Precedence coverage for `StepperCommandDialog`'s Next/Previous/Submit labels (the `stepper`
 * provider group) and its footer Cancel label (the `dialog` provider group, the same group
 * `Dialog` itself resolves through) — a named component prop wins, then the provider message,
 * then the English fallback.
 */
describe('when StepperCommandDialog uses provider messages', () => {
    let dialog: StepperDialogInTheDom;

    afterEach(async () => {
        if (dialog) await unmount(dialog);
    });

    it('should use the English fallback with no provider and no prop override', async () => {
        dialog = await render(
            <CratisComponentsProvider>
                <StepperCommandDialog<TestCommand>
                    command={TestCommand}
                    visible
                    title='Wizard'
                    showCancel
                >
                    <StepperPanel header='Step 1'>Content one</StepperPanel>
                    <StepperPanel header='Step 2'>Content two</StepperPanel>
                </StepperCommandDialog>
            </CratisComponentsProvider>,
        );

        expect(buttonLabels(dialog)).to.include('Next');
        expect(buttonLabels(dialog)).to.include('Cancel');
    });

    it('should use the provider messages for Next and the footer Cancel when no prop override is given', async () => {
        dialog = await render(
            <CratisComponentsProvider
                value={{
                    messages: {
                        stepper: { next: 'Provider Next', submit: 'Provider Submit' },
                        dialog: { cancel: 'Provider Cancel' },
                    },
                }}
            >
                <StepperCommandDialog<TestCommand>
                    command={TestCommand}
                    visible
                    title='Wizard'
                    showCancel
                >
                    <StepperPanel header='Step 1'>Content one</StepperPanel>
                    <StepperPanel header='Step 2'>Content two</StepperPanel>
                </StepperCommandDialog>
            </CratisComponentsProvider>,
        );

        expect(buttonLabels(dialog)).to.include('Provider Next');
        expect(buttonLabels(dialog)).to.include('Provider Cancel');
        expect(buttonLabels(dialog)).not.to.include('Next');
        expect(buttonLabels(dialog)).not.to.include('Cancel');
    });

    it('should prefer named prop overrides over the provider messages', async () => {
        dialog = await render(
            <CratisComponentsProvider
                value={{
                    messages: {
                        stepper: { next: 'Provider Next' },
                        dialog: { cancel: 'Provider Cancel' },
                    },
                }}
            >
                <StepperCommandDialog<TestCommand>
                    command={TestCommand}
                    visible
                    title='Wizard'
                    showCancel
                    nextLabel='Explicit Next'
                    cancelLabel='Explicit Cancel'
                >
                    <StepperPanel header='Step 1'>Content one</StepperPanel>
                    <StepperPanel header='Step 2'>Content two</StepperPanel>
                </StepperCommandDialog>
            </CratisComponentsProvider>,
        );

        expect(buttonLabels(dialog)).to.include('Explicit Next');
        expect(buttonLabels(dialog)).to.include('Explicit Cancel');
        expect(buttonLabels(dialog)).not.to.include('Provider Next');
        expect(buttonLabels(dialog)).not.to.include('Provider Cancel');
    });
});
