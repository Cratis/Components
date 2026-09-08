// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';

vi.mock('@cratis/arc.react/commands', () => ({
    asCommandFormField: (component: ComponentType<Record<string, unknown>>) => component,
}));

import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { NumberInputField } from '../fields/NumberInputField';

interface InjectedNumberInputFieldProps {
    value: number;
    onChange: (value: unknown) => void;
    onBlur?: () => void;
    invalid: boolean;
    required: boolean;
    errors: string[];
    title?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
}

// SAFETY: The mocked asCommandFormField returns the injected component unchanged in this spec.
const Field = NumberInputField as unknown as ComponentType<InjectedNumberInputFieldProps>;

describe('when NumberInputField reuses NumberInput', () => {
    let container: HTMLDivElement;
    let root: Root;

    afterEach(async () => {
        if (root) await act(async () => root.unmount());
        container?.remove();
    });

    const render = async (props: Partial<InjectedNumberInputFieldProps> = {}) => {
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        const onChange = vi.fn();
        const onBlur = vi.fn();
        await act(async () => {
            root.render(
                <CratisComponentsProvider value={{ locale: 'nb-NO' }}>
                    <Field
                        value={1234.5}
                        onChange={onChange}
                        onBlur={onBlur}
                        invalid={false}
                        required={false}
                        errors={[]}
                        title='Sample amount'
                        minimumFractionDigits={2}
                        maximumFractionDigits={2}
                        {...props}
                    />
                </CratisComponentsProvider>,
            );
        });
        return { onChange, onBlur };
    };

    it('should render the standalone owner parts and provider locale formatting', async () => {
        await render();
        const input = container.querySelector<HTMLInputElement>(
            'input[data-cratis-part="input"]',
        )!;

        expect(input.value.replace(/[\u00a0\u202f]/gu, ' ')).to.equal('1 234,50');
        expect(container.querySelectorAll('[data-cratis-part="step"]')).to.have.lengthOf(
            2,
        );
        expect(input.getAttribute('aria-label')).to.equal('Sample amount');
    });

    it('should map nullable clear to the explicit non-null command default', async () => {
        const { onChange, onBlur } = await render();
        const input = container.querySelector<HTMLInputElement>(
            'input[data-cratis-part="input"]',
        )!;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
            input,
            '',
        );
        await act(async () => {
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
            input.blur();
            await Promise.resolve();
        });

        expect(onChange.mock.calls[0][0]).to.equal(0);
        expect(onBlur.mock.calls).to.have.lengthOf(1);
    });

    it('should carry Arc required state to the editable control', async () => {
        await render({ required: true });
        const input = container.querySelector<HTMLInputElement>(
            'input[data-cratis-part="input"]',
        )!;

        expect(input.required).to.equal(true);
        expect(
            container
                .querySelector('[data-cratis-part="root"]')
                ?.getAttribute('data-required'),
        ).to.equal('true');
    });

    it('should associate Arc validation messages without a second field state machine', async () => {
        await render({
            invalid: true,
            required: true,
            errors: ['The sample amount must be at least zero.'],
        });
        const input = container.querySelector<HTMLInputElement>(
            'input[data-cratis-part="input"]',
        )!;
        const describedBy = input.getAttribute('aria-describedby')!;
        const error = document.getElementById(describedBy);

        expect(input.required).to.equal(true);
        expect(input.getAttribute('aria-invalid')).to.equal('true');
        expect(error?.textContent).to.equal('The sample amount must be at least zero.');
    });
});
