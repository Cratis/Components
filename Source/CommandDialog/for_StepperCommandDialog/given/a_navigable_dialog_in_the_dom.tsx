// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { act } from 'react';
import { vi } from 'vitest';
import { StepperCommandDialog } from '../../StepperCommandDialog';
import { StepperPanel } from '../../StepperPanel';
import { render, type StepperDialogInTheDom } from './a_stepper_dialog_in_the_dom';

const validation = vi.hoisted(() => ({ invalid: false }));
export { validation };
export const onChangeStep = vi.fn();

vi.mock('../../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.buttons, props.children),
}));
vi.mock('../../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean; onClick?: () => void }) =>
        React.createElement('button', { disabled: props.disabled, onClick: props.onClick }, props.children),
}));
vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
}));
vi.mock('@cratis/arc.react/commands', () => {
    const context = {
        isValid: true,
        setCommandValues: vi.fn(),
        setCommandResult: vi.fn(),
        getFieldError: (name: string) => name === 'name' && validation.invalid ? 'Required' : undefined,
    };
    return {
        CommandForm: (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children),
        useCommandFormContext: () => context,
        useCommandInstance: () => ({}),
        CommandFormFieldWrapper: (props: { field?: React.ReactNode }) => React.createElement('div', null, props.field),
    };
});

class SampleCommand {
    name = '';
}
const NameField = (props: { value: (command: SampleCommand) => unknown }) => {
    void props;
    return null;
};
NameField.displayName = 'CommandFormField';

export const mount = (linear = true): Promise<StepperDialogInTheDom> => render(
    <StepperCommandDialog command={SampleCommand as unknown as new () => object} title='Example Wizard' linear={linear} onChangeStep={onChangeStep}>
        <StepperPanel header='First'><NameField value={(command) => command.name} /></StepperPanel>
        <StepperPanel header='Second'>Second content</StepperPanel>
    </StepperCommandDialog>,
);

export const clickHeader = async (dialog: StepperDialogInTheDom, label: string) => {
    const button = Array.from(dialog.container.querySelectorAll<HTMLButtonElement>('[data-cratis-part="header"]'))
        .find((candidate) => candidate.querySelector('[data-cratis-part="title"]')?.textContent === label);
    if (!button) throw new Error('Step header missing');
    await act(async () => button.click());
};
