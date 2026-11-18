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

import { arcProps, asDirectComponent, fieldCases } from './given/field_cases';
import { resetSlotCalls, slotCalls, withStubAdapter } from './given/a_stub_adapter';

const slotFor: Record<string, string> = {
    text: 'common.textInput',
    email: 'common.textInput',
    'text with parts': 'common.textInput',
    'invalid text': 'common.textInput',
    textarea: 'common.textArea',
    'textarea defaults': 'common.textArea',
    checkbox: 'common.checkbox',
    'checkbox with parts': 'common.checkbox',
    'checkbox without label': 'common.checkbox',
    switch: 'common.switch',
    'switch with parts': 'common.switch',
    'radio group': 'common.radio',
    'horizontal radio group': 'common.radio',
    'radio button': 'common.radio',
    'radio button with parts': 'common.radio',
};

describe('when an adapter is active', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        resetSlotCalls();
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const render = async (name: string, extra: Record<string, unknown> = {}) => {
        const fieldCase = fieldCases.find((candidate) => candidate.name === name)!;
        const Field = asDirectComponent(fieldCase.component);
        await act(async () => root.render(withStubAdapter(<Field {...arcProps} {...fieldCase.props} {...extra} />)));
    };

    const lastProps = (slotId: string) => slotCalls[slotId].at(-1)!;

    fieldCases.forEach((fieldCase) => {
        it(`should render the ${fieldCase.name} field through ${slotFor[fieldCase.name]}`, async () => {
            await render(fieldCase.name);
            expect(container.querySelectorAll('[data-stub]').length).to.be.greaterThan(0);
            expect(slotCalls[slotFor[fieldCase.name]]).to.have.length.greaterThan(0);
            expect(container.querySelector('.cratis-field-input, [class*="cratis-choice"], [class*="cratis-radio__"]')).to.equal(null);
        });
    });

    it('should pass identity, accessibility and validity to the text input slot', async () => {
        await render('invalid text', { id: 'name-input', 'aria-describedby': 'hint' });
        const props = lastProps('common.textInput');
        expect(props.id).to.equal('name-input');
        expect(props['aria-label']).to.equal('Name');
        expect(props['aria-describedby']).to.equal('hint name-input-errors');
        expect(props.invalid).to.equal(true);
        expect(props['aria-invalid']).to.equal(true);
        expect(container.querySelector('#name-input-errors')!.textContent!).to.equal('Bad value. Worse');
    });

    it('should hand consumer classes and parts to the slot without Cratis field classes', async () => {
        await render('text with parts');
        const props = lastProps('common.textInput');
        expect(props.className).to.equal('consumer');
        expect((props.pt as { root: { className: string } }).root.className).to.equal('part');
    });

    it('should pass the default row count to the textarea slot', async () => {
        await render('textarea defaults');
        expect(lastProps('common.textArea').rows).to.equal(5);
    });

    it('should report semantic text changes from the slot', async () => {
        const onChange = vi.fn();
        await render('text', { onChange });
        const input = container.querySelector<HTMLInputElement>('[data-stub="text"]')!;
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Grace');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        expect(onChange.mock.lastCall![0]).to.equal('Grace');
    });

    it('should report semantic checkbox and switch changes from the slot', async () => {
        for (const name of ['checkbox', 'switch']) {
            const onChange = vi.fn();
            await render(`${name}`, { onChange, value: false });
            await act(async () => container.querySelector<HTMLInputElement>('[data-stub]')!.click());
            expect(onChange.mock.lastCall![0]).to.equal(true);
        }
    });

    it('should report the option value only when a radio becomes selected', async () => {
        const onChange = vi.fn();
        await render('radio group', { onChange, value: 'one' });
        const radios = container.querySelectorAll<HTMLInputElement>('[data-stub="radio"]');
        expect(radios).to.have.lengthOf(2);
        expect(slotCalls['common.radio'].slice(-2).map((props) => props.checked)).to.deep.equal([true, false]);
        await act(async () => radios[1].click());
        expect(onChange.mock.lastCall![0]).to.equal('two');
    });

    it('should hand the radio button its value, name and checked state', async () => {
        await render('radio button');
        const props = lastProps('common.radio');
        expect(props.name).to.equal('grp');
        expect(props.value).to.equal('a');
        expect(props.checked).to.equal(true);
    });

    it('should forward blur to the slot', async () => {
        const onBlur = vi.fn();
        await render('text', { onBlur });
        await act(async () => {
            const input = container.querySelector<HTMLInputElement>('[data-stub="text"]')!;
            input.focus();
            input.blur();
        });
        expect(onBlur.mock.calls.length).to.be.greaterThan(0);
    });
});
