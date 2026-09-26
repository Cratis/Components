// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { CommandStepper } from '../CommandStepper';
import { StepperPanel } from '../StepperPanel';

const validation = vi.hoisted(() => ({ invalid: false }));

vi.mock('../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean; onClick?: () => void }) =>
        React.createElement('button', { disabled: props.disabled, onClick: props.onClick }, props.children),
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
let container: HTMLDivElement;
let root: Root;

const mount = async (linear = true) => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
        root.render(
            <CommandStepper command={SampleCommand as unknown as new () => object} linear={linear} onChangeStep={onChangeStep}>
                <StepperPanel header='First'><NameField value={(command) => command.name} /></StepperPanel>
                <StepperPanel header='Second'>Second content</StepperPanel>
            </CommandStepper>,
        );
    });
};

const click = async (button: HTMLButtonElement | undefined) => {
    if (!button) throw new Error('Navigation button missing');
    await act(async () => button.click());
};

const labeled = (label: string) => Array.from(container.querySelectorAll('button'))
    .find((button) => button.querySelector('[data-cratis-part="title"]')?.textContent === label || button.textContent === label);
const activeIndex = () => container.querySelector('[data-cratis-part="root"]')?.getAttribute('data-value');

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

describe('when advancing the inline wizard', () => {
    beforeEach(async () => {
        validation.invalid = false;
        onChangeStep.mockClear();
        await mount();
        await click(labeled('Next'));
    });

    it('should report the new index once after the step changes', () => {
        activeIndex().should.equal('1');
        onChangeStep.mock.calls.should.deep.equal([[{ index: 1 }]]);
    });

    it('should label the active panel with its header', () => {
        const panels = container.querySelectorAll<HTMLElement>('[data-cratis-part="panel"]');
        const headers = container.querySelectorAll<HTMLElement>('[data-cratis-part="header"]');
        headers.length.should.equal(panels.length);
        for (let index = 0; index < panels.length; index++) {
            headers[index].id.should.not.equal('');
            (panels[index].getAttribute('aria-labelledby') ?? '').should.equal(headers[index].id);
        }
        headers[0].id.should.not.equal(headers[1].id);
    });
});

describe('when returning to the previous inline step', () => {
    beforeEach(async () => {
        validation.invalid = false;
        onChangeStep.mockClear();
        await mount();
        await click(labeled('Next'));
        onChangeStep.mockClear();
        await click(labeled('Previous'));
    });

    it('should report the new index once after the step changes', () => {
        activeIndex().should.equal('0');
        onChangeStep.mock.calls.should.deep.equal([[{ index: 0 }]]);
    });
});

describe('when a current step has a validation error', () => {
    beforeEach(async () => {
        validation.invalid = true;
        onChangeStep.mockClear();
        await mount(false);
        await click(labeled('Second'));
    });

    it('should not move or report a change', () => {
        activeIndex().should.equal('0');
        onChangeStep.mock.calls.should.deep.equal([]);
    });
});

describe('when clicking a future header in linear mode', () => {
    beforeEach(async () => {
        validation.invalid = false;
        onChangeStep.mockClear();
        await mount();
        await click(labeled('Second'));
    });

    it('should not move or report a change', () => {
        activeIndex().should.equal('0');
        onChangeStep.mock.calls.should.deep.equal([]);
    });
});

describe('when clicking the current header in non-linear mode', () => {
    beforeEach(async () => {
        validation.invalid = false;
        onChangeStep.mockClear();
        await mount(false);
        await click(labeled('First'));
    });

    it('should not report a change', () => {
        activeIndex().should.equal('0');
        onChangeStep.mock.calls.should.deep.equal([]);
    });
});

describe('when clicking a different header in non-linear mode', () => {
    beforeEach(async () => {
        validation.invalid = false;
        onChangeStep.mockClear();
        await mount(false);
        await click(labeled('Second'));
    });

    it('should report the new index once after the step changes', () => {
        activeIndex().should.equal('1');
        onChangeStep.mock.calls.should.deep.equal([[{ index: 1 }]]);
    });
});
