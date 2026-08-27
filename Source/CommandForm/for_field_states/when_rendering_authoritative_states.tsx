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

import { CheckboxField } from '../fields/CheckboxField';
import { ChipsField } from '../fields/ChipsField';
import { ColorPickerField } from '../fields/ColorPickerField';
import { InputTextField } from '../fields/InputTextField';
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
    onChange: () => undefined,
};

describe('when CommandForm fields render authoritative states', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
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
            root.render(<Field {...baseProps} {...props} />);
        });
    };

    const part = (name: string) => {
        switch (name) {
            case 'root':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="root"]',
                );
            case 'input':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="input"]',
                );
            case 'box':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="box"]',
                );
            case 'indicator':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="indicator"]',
                );
            case 'option':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="option"]',
                );
            case 'star':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="star"]',
                );
            case 'control':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="control"]',
                );
            case 'handle':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="handle"]',
                );
            case 'item':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="item"]',
                );
            case 'remove':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="remove"]',
                );
            case 'toggle':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="toggle"]',
                );
            case 'value':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="value"]',
                );
            case 'textarea':
                return container.querySelector<HTMLElement>(
                    '[data-cratis-part="textarea"]',
                );
            default:
                throw new Error(`Unknown CommandForm field part: ${name}`);
        }
    };

    it('should emit text invalid, disabled, and readonly only while present', async () => {
        await renderField(InputTextField, {
            value: 'Sample value',
            invalid: true,
            pt: {
                root: {
                    disabled: true,
                    readOnly: true,
                    'data-testid': 'text-control',
                },
            },
        });

        const control = part('input');
        expect(control?.dataset.invalid).to.equal('true');
        expect(control?.dataset.disabled).to.equal('true');
        expect(control?.dataset.readonly).to.equal('true');
        expect(control?.getAttribute('data-testid')).to.equal('text-control');

        await renderField(InputTextField, { value: 'Sample value' });
        expect(part('input')?.hasAttribute('data-invalid')).to.equal(false);
        expect(part('input')?.hasAttribute('data-disabled')).to.equal(false);
        expect(part('input')?.hasAttribute('data-readonly')).to.equal(false);
    });

    it('should put checkbox selection and validation on every choice part and preserve pt destinations', async () => {
        await renderField(CheckboxField, {
            value: true,
            invalid: true,
            pt: {
                root: { 'data-testid': 'checkbox-root' },
                input: { disabled: true, 'data-testid': 'checkbox-input' },
                box: { 'data-testid': 'checkbox-box' },
                indicator: { 'data-testid': 'checkbox-indicator' },
            },
        });

        for (const name of ['root', 'input', 'box', 'indicator']) {
            const element = part(name);
            expect(element?.dataset.selected).to.equal('true');
            expect(element?.dataset.invalid).to.equal('true');
            expect(element?.dataset.disabled).to.equal('true');
            expect(element?.getAttribute('data-testid')).to.equal(`checkbox-${name}`);
        }

        await renderField(CheckboxField, { value: false });
        for (const name of ['root', 'input', 'box', 'indicator']) {
            expect(part(name)?.hasAttribute('data-selected')).to.equal(false);
            expect(part(name)?.hasAttribute('data-invalid')).to.equal(false);
            expect(part(name)?.hasAttribute('data-disabled')).to.equal(false);
        }
    });

    it('should identify the selected radio option without marking its siblings', async () => {
        await renderField(RadioGroupField, {
            value: 'two',
            invalid: true,
            options: [
                { value: 'one', label: 'One' },
                { value: 'two', label: 'Two' },
            ],
            optionValue: 'value',
            optionLabel: 'label',
            pt: { option: { 'data-testid': 'radio-option' } },
        });

        const options = container.querySelectorAll<HTMLElement>(
            '[data-cratis-part="option"]',
        );
        expect(options[0].hasAttribute('data-selected')).to.equal(false);
        expect(options[1].dataset.selected).to.equal('true');
        expect(options[0].dataset.invalid).to.equal('true');
        expect(options[1].getAttribute('data-testid')).to.equal('radio-option');

        await renderField(RadioButtonField, {
            value: 'two',
            buttonValue: 'two',
            name: 'sample-choice',
            invalid: true,
        });
        expect(part('root')?.dataset.selected).to.equal('true');
        expect(part('input')?.dataset.invalid).to.equal('true');
    });

    it('should distinguish the selected rating option from its selected stars', async () => {
        await renderField(RatingField, {
            value: 2,
            stars: 3,
            invalid: true,
            pt: { star: { 'data-testid': 'rating-star' } },
        });

        const options = container.querySelectorAll<HTMLElement>(
            '[data-cratis-part="option"]',
        );
        const stars = container.querySelectorAll<HTMLElement>(
            '[data-cratis-part="star"]',
        );
        expect(options[0].hasAttribute('data-selected')).to.equal(false);
        expect(options[1].dataset.selected).to.equal('true');
        expect(options[2].hasAttribute('data-selected')).to.equal(false);
        expect(Array.from(stars, (star) => star.hasAttribute('data-selected'))).to.deep.equal([
            true,
            true,
            false,
        ]);
        expect(stars[1].dataset.invalid).to.equal('true');
        expect(stars[1].getAttribute('data-testid')).to.equal('rating-star');
    });

    it('should put switch selection on the root, input, control, and handle', async () => {
        await renderField(ToggleSwitchField, {
            value: true,
            pt: { control: { 'data-testid': 'switch-control' } },
        });
        for (const name of ['root', 'input', 'control', 'handle']) {
            expect(part(name)?.dataset.selected).to.equal('true');
        }
        expect(part('control')?.getAttribute('data-testid')).to.equal(
            'switch-control',
        );

        await renderField(ToggleSwitchField, { value: false });
        for (const name of ['root', 'input', 'control', 'handle']) {
            expect(part(name)?.hasAttribute('data-selected')).to.equal(false);
        }
    });

    it('should identify chips as selected values and keep false states absent', async () => {
        await renderField(ChipsField, {
            value: ['One'],
            invalid: true,
            pt: {
                item: { 'data-testid': 'chip-item' },
                input: { readOnly: true },
            },
        });
        expect(part('item')?.dataset.selected).to.equal('true');
        expect(part('remove')?.dataset.selected).to.equal('true');
        expect(part('item')?.getAttribute('data-testid')).to.equal('chip-item');
        expect(part('root')?.dataset.invalid).to.equal('true');
        expect(part('input')?.dataset.readonly).to.equal('true');

        await renderField(ChipsField, { value: [] });
        expect(part('item')).to.equal(null);
        expect(part('input')?.hasAttribute('data-invalid')).to.equal(false);
        expect(part('input')?.hasAttribute('data-readonly')).to.equal(false);
    });

    it('should expose the password toggle disabled state only while present', async () => {
        await renderField(PasswordField, {
            value: 'example',
            pt: {
                toggle: {
                    disabled: true,
                    'data-testid': 'password-toggle',
                },
            },
        });
        expect(part('toggle')?.dataset.disabled).to.equal('true');
        expect(part('toggle')?.getAttribute('data-testid')).to.equal(
            'password-toggle',
        );

        await renderField(PasswordField, { value: 'example' });
        expect(part('toggle')?.hasAttribute('data-disabled')).to.equal(false);
    });

    it('should expose validation state on the remaining native field surfaces', async () => {
        for (const [component, props, parts] of [
            [ColorPickerField, { value: '112233' }, ['root', 'input', 'value']],
            [NumberField, { value: 12 }, ['root', 'input']],
            [PasswordField, { value: 'example' }, ['root', 'input']],
            [SliderField, { value: 25 }, ['root', 'input', 'value']],
            [TextAreaField, { value: 'Sample notes' }, ['textarea']],
        ] as const) {
            await renderField(component, { ...props, invalid: true });
            for (const name of parts) {
                expect(part(name)?.dataset.invalid).to.equal('true');
            }

            await renderField(component, props);
            for (const name of parts) {
                expect(part(name)?.hasAttribute('data-invalid')).to.equal(false);
            }
        }
    });
});
