// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { expect } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { NumberInput } from '../NumberInput';
import { NumberInputCommitReason } from '../NumberInputCommitReason';
import {
    editNumberInput,
    mountNumberInput,
    pressNumberInputKey,
    type MountedNumberInput,
} from './given/a_number_input';
import { unmountPrimitive } from '../for_Primitives/given/a_primitive_dom';

const numberInput = (
    <CratisComponentsProvider value={{ locale: 'en-US' }}>
        <label id='sample-amount-label' htmlFor='sample-amount'>
            Sample amount
        </label>
        <p id='external-sample-hint'>Use the documented sample unit.</p>
        <NumberInput
            id='sample-amount'
            name='sampleAmount'
            value={12.5}
            onChange={() => undefined}
            prefix='$'
            suffix='kg'
            min={0}
            max={100}
            step={0.5}
            minimumFractionDigits={1}
            maximumFractionDigits={1}
            aria-labelledby='sample-amount-label'
            aria-describedby='external-sample-hint'
            description='Enter a sample amount.'
            errorMessage='The sample amount is invalid.'
            invalid
            pt={{
                root: { 'data-contract': 'root' },
                input: { 'data-contract': 'input' },
                prefix: { 'data-contract': 'prefix' },
                suffix: { 'data-contract': 'suffix' },
                step: { 'data-contract': 'step' },
                description: { 'data-contract': 'description' },
                error: { 'data-contract': 'error' },
            }}
        />
    </CratisComponentsProvider>
);

const renderStaticNumberInput = () => {
    const serverDocument = new DOMParser().parseFromString(
        renderToString(numberInput),
        'text/html',
    );
    const container = document.createElement('div');
    container.replaceChildren(
        ...Array.from(serverDocument.body.childNodes).map((node) =>
            document.importNode(node, true),
        ),
    );
    return container;
};

describe('when rendering number input semantics', () => {
    let mounted: MountedNumberInput | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    it('should retain React Aria number-field semantics and tie step actions to its external label', async () => {
        const container = renderStaticNumberInput();
        const input = container.querySelector<HTMLInputElement>(
            'input[data-cratis-part="input"]',
        )!;
        const label = container.querySelector<HTMLLabelElement>('label')!;
        const stepButtons = Array.from(
            container.querySelectorAll<HTMLButtonElement>('[data-cratis-part="step"]'),
        );

        expect(input.id).to.equal('sample-amount');
        expect(label.htmlFor).to.equal('sample-amount');
        expect(input.getAttribute('role')).to.equal(null);
        expect(input.getAttribute('aria-roledescription')).to.equal('Number field');
        expect(input.getAttribute('aria-labelledby')).to.equal('sample-amount-label');
        expect(input.value).to.equal('12.5');
        expect(
            stepButtons.map((button) => button.getAttribute('aria-label')),
        ).to.deep.equal(['Decrease', 'Increase']);
        expect(
            stepButtons.every((button) =>
                button
                    .getAttribute('aria-labelledby')
                    ?.split(' ')
                    .includes('sample-amount-label'),
            ),
        ).to.equal(true);
        expect(input.getAttribute('aria-invalid')).to.equal('true');
        expect(input.getAttribute('aria-errormessage')).to.equal('sample-amount-error');
        expect(input.getAttribute('aria-describedby')?.split(' ')).to.deep.equal([
            'external-sample-hint',
            'sample-amount-prefix',
            'sample-amount-suffix',
            'sample-amount-description',
            'sample-amount-error',
        ]);
    });

    it('should keep adornments outside semantic changes while editing', async () => {
        mounted = await mountNumberInput({
            initialValue: null,
            'aria-label': 'Weight',
            prefix: '$',
            suffix: 'kg',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });

        await editNumberInput(mounted, '12.5');
        await pressNumberInputKey(mounted, 'Enter');

        expect(mounted.events).to.deep.equal([
            { kind: 'change', value: 12.5 },
            {
                kind: 'commit',
                value: 12.5,
                reason: NumberInputCommitReason.Enter,
            },
        ]);
        expect(mounted.input.value).to.equal('12.5');
    });

    it('should keep adornments outside the semantic and submitted number values', () => {
        const container = renderStaticNumberInput();
        const visibleInput = container.querySelector<HTMLInputElement>(
            'input[data-cratis-part="input"]',
        )!;
        const hiddenInput =
            container.querySelector<HTMLInputElement>('input[type="hidden"]')!;

        expect(visibleInput.value).to.equal('12.5');
        expect(hiddenInput.value).to.equal('12.5');
        expect(hiddenInput.name).to.equal('sampleAmount');
        expect(visibleInput.value).not.to.contain('$');
        expect(visibleInput.value).not.to.contain('kg');
    });

    it('should expose exact stable parts, directions, and canonical states', () => {
        const container = renderStaticNumberInput();
        const parts = Array.from(
            container.querySelectorAll<HTMLElement>('[data-cratis-part]'),
        );

        expect(parts.map((part) => part.dataset.cratisPart)).to.deep.equal([
            'root',
            'prefix',
            'input',
            'suffix',
            'step',
            'step',
            'description',
            'error',
        ]);
        expect(
            parts
                .filter((part) => part.dataset.cratisPart === 'step')
                .map((part) => part.dataset.step),
        ).to.deep.equal(['decrement', 'increment']);
        expect(parts[0].getAttribute('data-invalid')).to.equal('true');
        expect(parts.at(-1)?.getAttribute('data-invalid')).to.equal('true');
        expect(parts.every((part) => part.dataset.contract)).to.equal(true);
    });

    it('should block native form submission while a required value is empty', async () => {
        mounted = await mountNumberInput({
            initialValue: null,
            'aria-label': 'Quantity',
            name: 'quantity',
            required: true,
            insideForm: true,
        });
        let submitCount = 0;
        mounted.form?.addEventListener('submit', (event) => {
            event.preventDefault();
            submitCount += 1;
        });

        expect(mounted.input.required).to.equal(true);
        expect(mounted.field.getAttribute('data-required')).to.equal('true');
        expect(mounted.form?.checkValidity()).to.equal(false);
        await act(async () => mounted?.form?.requestSubmit());
        expect(submitCount).to.equal(0);

        await editNumberInput(mounted, '5');
        await pressNumberInputKey(mounted, 'Enter');

        expect(mounted.form?.checkValidity()).to.equal(true);
        expect(new FormData(mounted.form).get('quantity')).to.equal('5');
        await act(async () => mounted?.form?.requestSubmit());
        expect(submitCount).to.equal(1);
    });

    it('should disable editing, steps, and hidden form submission', async () => {
        mounted = await mountNumberInput({
            initialValue: 5,
            'aria-label': 'Quantity',
            name: 'quantity',
            disabled: true,
        });
        const hiddenInput =
            mounted.container.querySelector<HTMLInputElement>('input[type="hidden"]')!;

        expect(mounted.input.disabled).to.equal(true);
        expect(hiddenInput.disabled).to.equal(true);
        expect(mounted.stepButtons.every((button) => button.disabled)).to.equal(true);
        expect(mounted.field.getAttribute('data-disabled')).to.equal('true');
    });

    it('should retain focus semantics while preventing read-only edits and steps', async () => {
        mounted = await mountNumberInput({
            initialValue: 5,
            'aria-label': 'Quantity',
            readOnly: true,
        });

        expect(mounted.input.readOnly).to.equal(true);
        expect(mounted.input.disabled).to.equal(false);
        expect(mounted.input.getAttribute('aria-readonly')).to.equal('true');
        expect(mounted.stepButtons.every((button) => button.disabled)).to.equal(true);
        expect(mounted.field.getAttribute('data-readonly')).to.equal('true');
    });

    it('should render non-finite controlled values as empty without NaN semantics', async () => {
        mounted = await mountNumberInput({
            initialValue: Number.NaN,
            'aria-label': 'Quantity',
        });

        expect(mounted.input.value).to.equal('');
        expect(mounted.input.hasAttribute('aria-valuenow')).to.equal(false);
        expect(mounted.field.getAttribute('data-empty')).to.equal('true');
    });

    it('should hydrate the server markup without changing ids or reporting mismatches', async () => {
        const container = renderStaticNumberInput();
        document.body.append(container);
        const serverInputId = container.querySelector<HTMLInputElement>(
            'input[data-cratis-part="input"]',
        )!.id;
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);
        let root: Root | undefined;
        try {
            await act(async () => {
                root = hydrateRoot(container, numberInput);
                await Promise.resolve();
            });
            expect(
                container.querySelector<HTMLInputElement>(
                    'input[data-cratis-part="input"]',
                )!.id,
            ).to.equal(serverInputId);
            expect(
                consoleError.mock.calls.some((call) =>
                    String(call[0]).toLowerCase().includes('hydration'),
                ),
            ).to.equal(false);
        } finally {
            if (root) await act(async () => root?.unmount());
            consoleError.mockRestore();
            container.remove();
        }
    });
});
