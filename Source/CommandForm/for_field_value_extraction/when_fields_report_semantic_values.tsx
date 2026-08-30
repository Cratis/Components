// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

vi.mock('@cratis/arc.react/commands', () => ({
    asCommandFormField: (component: ComponentType<Record<string, unknown>>) => component,
}));

vi.mock('../../Dropdown/Dropdown', async () => {
    const React = await import('react');
    return {
        Dropdown: (props: {
            multiple?: boolean;
            onChange: (value: string | Array<string>) => void;
        }) =>
            React.createElement(
                'button',
                {
                    type: 'button',
                    'data-testid': props.multiple ? 'multi-dropdown' : 'dropdown',
                    onClick: () => props.onChange(props.multiple ? ['two'] : 'two'),
                },
                'Change selection',
            ),
    };
});

vi.mock('../../Common/DatePickerInput', async () => {
    const React = await import('react');
    return {
        DatePickerInput: (props: { onChange: (value: Date | null) => void }) =>
            React.createElement(
                'button',
                {
                    type: 'button',
                    'data-testid': 'calendar',
                    onClick: () => props.onChange(new Date(2026, 7, 27)),
                },
                'Change date',
            ),
    };
});

import { CalendarField } from '../fields/CalendarField';
import { CheckboxField } from '../fields/CheckboxField';
import { ChipsField } from '../fields/ChipsField';
import { ColorPickerField } from '../fields/ColorPickerField';
import { DropdownField } from '../fields/DropdownField';
import { InputTextField } from '../fields/InputTextField';
import { MultiSelectField } from '../fields/MultiSelectField';
import { NumberField } from '../fields/NumberField';
import { PasswordField } from '../fields/PasswordField';
import { RadioButtonField } from '../fields/RadioButtonField';
import { RadioGroupField } from '../fields/RadioGroupField';
import { RatingField } from '../fields/RatingField';
import { SliderField } from '../fields/SliderField';
import { TextAreaField } from '../fields/TextAreaField';
import { ToggleSwitchField } from '../fields/ToggleSwitchField';

const asDirectComponent = (component: unknown) =>
    component as ComponentType<Record<string, unknown>>;

const baseProps = {
    invalid: false,
    required: false,
    errors: [],
};

describe('when CommandForm fields report semantic values', () => {
    let container: HTMLDivElement;
    let root: Root;
    const onChange = vi.fn();

    beforeEach(() => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        onChange.mockClear();
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const renderField = async (
        component: unknown,
        props: Record<string, unknown>,
    ) => {
        const Field = asDirectComponent(component);
        await act(async () => {
            root.render(<Field {...baseProps} {...props} onChange={onChange} />);
        });
    };

    const setValue = async (
        element: HTMLInputElement | HTMLTextAreaElement,
        value: string,
    ) => {
        await act(async () => {
            const prototype = element instanceof HTMLTextAreaElement
                ? HTMLTextAreaElement.prototype
                : HTMLInputElement.prototype;
            Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value);
            element.dispatchEvent(new Event('input', { bubbles: true }));
        });
    };

    it('should extract text, password, and textarea strings', async () => {
        for (const [component, selector] of [
            [InputTextField, 'input'],
            [PasswordField, 'input'],
            [TextAreaField, 'textarea'],
        ] as const) {
            await renderField(component, { value: '' });
            const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
            if (!input) throw new Error(`Field did not render ${selector}.`);
            await setValue(input, 'semantic');
            expect(onChange.mock.lastCall?.[0]).to.equal('semantic');
        }
    });

    it('should extract checkbox and switch booleans', async () => {
        for (const component of [CheckboxField, ToggleSwitchField]) {
            await renderField(component, { value: false });
            const input = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
            if (!input) throw new Error('Boolean field did not render a checkbox.');
            await act(async () => input.click());
            expect(onChange.mock.lastCall?.[0]).to.equal(true);
        }
    });

    it('should extract color, number, and range primitives', async () => {
        await renderField(ColorPickerField, { value: '000000' });
        const color = container.querySelector<HTMLInputElement>('input[type="color"]')!;
        await setValue(color, '#aabbcc');
        expect(onChange.mock.lastCall?.[0]).to.equal('aabbcc');

        await renderField(NumberField, { value: 0 });
        const number = container.querySelector<HTMLInputElement>('input[type="number"]')!;
        await setValue(number, '42');
        expect(onChange.mock.lastCall?.[0]).to.equal(42);

        await renderField(SliderField, { value: 0 });
        const range = container.querySelector<HTMLInputElement>('input[type="range"]')!;
        await setValue(range, '25');
        expect(onChange.mock.lastCall?.[0]).to.equal(25);
    });

    it('should guard radio callbacks until an option becomes checked', async () => {
        await renderField(RadioButtonField, {
            value: 'one',
            buttonValue: 'two',
            label: 'Two',
        });
        const radio = container.querySelector<HTMLInputElement>('input[type="radio"]')!;
        await act(async () => radio.click());
        expect(onChange.mock.lastCall?.[0]).to.equal('two');

        await renderField(RadioGroupField, {
            value: 'one',
            options: [{ id: 'two', label: 'Two' }],
            optionValue: 'id',
            optionLabel: 'label',
        });
        await act(async () => container.querySelector<HTMLInputElement>('input')!.click());
        expect(onChange.mock.lastCall?.[0]).to.equal('two');

        await renderField(RatingField, { value: 0, stars: 2 });
        const stars = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
        await act(async () => stars[1].click());
        expect(onChange.mock.lastCall?.[0]).to.equal(2);
    });

    it('should report Chips arrays without event-shaped values', async () => {
        await renderField(ChipsField, { value: ['one'] });
        const input = container.querySelector<HTMLInputElement>('[data-cratis-part="input"]')!;
        await setValue(input, 'two');
        await act(async () => {
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        });
        expect(onChange.mock.lastCall?.[0]).to.deep.equal(['one', 'two']);
    });

    it('should pass semantic Dropdown, multi-select, and calendar values through Arc', async () => {
        await renderField(DropdownField, {
            value: 'one',
            options: [],
            optionValue: 'value',
            optionLabel: 'label',
        });
        await act(async () =>
            container.querySelector<HTMLButtonElement>('[data-testid="dropdown"]')!.click(),
        );
        expect(onChange.mock.lastCall?.[0]).to.equal('two');

        await renderField(MultiSelectField, {
            value: ['one'],
            options: [],
            optionValue: 'value',
            optionLabel: 'label',
        });
        await act(async () =>
            container.querySelector<HTMLButtonElement>('[data-testid="multi-dropdown"]')!.click(),
        );
        expect(onChange.mock.lastCall?.[0]).to.deep.equal(['two']);

        await renderField(CalendarField, { value: null });
        await act(async () =>
            container.querySelector<HTMLButtonElement>('[data-testid="calendar"]')!.click(),
        );
        expect(onChange.mock.lastCall?.[0]).to.deep.equal(new Date(2026, 7, 27));
    });
});
