// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act } from 'react';
import { vi } from 'vitest';
import { StepperCommandDialog } from '../StepperCommandDialog';
import { StepperPanel } from '../StepperPanel';
import { activeStep, click, render, unmount, type StepperDialogInTheDom } from './given/a_stepper_dialog_in_the_dom';

const validation = vi.hoisted(() => ({ invalid: false }));

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

const onChangeStep = vi.fn();
let dialog: StepperDialogInTheDom;

const mount = async (linear = true) => {
    dialog = await render(
        <StepperCommandDialog command={SampleCommand as unknown as new () => object} title='Example Wizard' linear={linear} onChangeStep={onChangeStep}>
            <StepperPanel header='First'><NameField value={(command) => command.name} /></StepperPanel>
            <StepperPanel header='Second'>Second content</StepperPanel>
        </StepperCommandDialog>,
    );
};

const clickHeader = async (label: string) => {
    const button = Array.from(dialog.container.querySelectorAll<HTMLButtonElement>('[data-cratis-part="header"]'))
        .find((candidate) => candidate.querySelector('[data-cratis-part="title"]')?.textContent === label);
    if (!button) throw new Error('Step header missing');
    await act(async () => button.click());
};

afterEach(async () => await unmount(dialog));

describe('when advancing the dialog wizard', () => {
    beforeEach(async () => {
        validation.invalid = false;
        onChangeStep.mockClear();
        await mount();
        await click(dialog, 'Next');
    });

    it('should report the new index once after the step changes', () => {
        activeStep(dialog).should.equal('1');
        onChangeStep.mock.calls.should.deep.equal([[{ index: 1 }]]);
    });

    it('should label the active panel with its header', () => {
        const panels = dialog.container.querySelectorAll<HTMLElement>('[data-cratis-part="panel"]');
        const headers = dialog.container.querySelectorAll<HTMLElement>('[data-cratis-part="header"]');
        headers.length.should.equal(panels.length);
        for (let index = 0; index < panels.length; index++) {
            headers[index].id.should.not.equal('');
            (panels[index].getAttribute('aria-labelledby') ?? '').should.equal(headers[index].id);
        }
        headers[0].id.should.not.equal(headers[1].id);
    });
});

describe('when returning to the previous dialog step', () => {
    beforeEach(async () => {
        validation.invalid = false;
        onChangeStep.mockClear();
        await mount();
        await click(dialog, 'Next');
        onChangeStep.mockClear();
        await click(dialog, 'Previous');
    });

    it('should report the new index once after the step changes', () => {
        activeStep(dialog).should.equal('0');
        onChangeStep.mock.calls.should.deep.equal([[{ index: 0 }]]);
    });
});

describe('when the dialog current step has a validation error', () => {
    beforeEach(async () => {
        validation.invalid = true;
        onChangeStep.mockClear();
        await mount(false);
        await clickHeader('Second');
    });

    it('should not move or report a change', () => {
        activeStep(dialog).should.equal('0');
        onChangeStep.mock.calls.should.deep.equal([]);
    });
});

describe('when clicking a future dialog header in linear mode', () => {
    beforeEach(async () => {
        validation.invalid = false;
        onChangeStep.mockClear();
        await mount();
        await clickHeader('Second');
    });

    it('should not move or report a change', () => {
        activeStep(dialog).should.equal('0');
        onChangeStep.mock.calls.should.deep.equal([]);
    });
});

describe('when clicking the current dialog header in non-linear mode', () => {
    beforeEach(async () => {
        validation.invalid = false;
        onChangeStep.mockClear();
        await mount(false);
        await clickHeader('First');
    });

    it('should not report a change', () => {
        activeStep(dialog).should.equal('0');
        onChangeStep.mock.calls.should.deep.equal([]);
    });
});

describe('when clicking a different dialog header in non-linear mode', () => {
    beforeEach(async () => {
        validation.invalid = false;
        onChangeStep.mockClear();
        await mount(false);
        await clickHeader('Second');
    });

    it('should report the new index once after the step changes', () => {
        activeStep(dialog).should.equal('1');
        onChangeStep.mock.calls.should.deep.equal([[{ index: 1 }]]);
    });
});
