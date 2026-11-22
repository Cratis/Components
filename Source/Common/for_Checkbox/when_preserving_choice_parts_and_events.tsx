// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef, type ChangeEvent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { vi } from 'vitest';
import { Checkbox, type CheckboxProps } from '../Checkbox';
import { Switch } from '../Switch';
import { Radio } from '../Radio';
import { mountPrimitive, unmountPrimitive } from '../for_Primitives/given/a_primitive_dom';

const choices = [
    { Control: Checkbox, name: 'Checkbox', parts: ['root', 'input', 'box', 'indicator', 'label'] },
    { Control: Switch, name: 'Switch', parts: ['root', 'input', 'control', 'handle', 'label'] },
    { Control: Radio, name: 'Radio', parts: ['root', 'input', 'box', 'indicator', 'label'] },
];

for (const { Control, name, parts } of choices) {
    describe(`when preserving ${name} native part precedence`, () => {
        it('should retain the label hierarchy, classes, styles, and canonical part markers', () => {
            const container = document.createElement('div');
            container.innerHTML = renderToStaticMarkup(<Control
                id='example-choice' name='example-group' value='example-value' label='Example choice'
                className='consumer-root' style={{ color: 'blue' }}
                disabled={false} readOnly={false} checked={false} aria-invalid={false}
                pt={{
                    root: { className: 'part-root', style: { color: 'red', margin: 2 }, title: 'Example root' },
                    input: { id: 'part-id', name: 'part-name', value: 'part-value', disabled: true, readOnly: true, checked: true, 'aria-invalid': true, className: 'part-input' },
                    label: { className: 'part-label', title: 'Example label' },
                }}
            />);
            const root = container.firstElementChild as HTMLLabelElement;
            const input = root.querySelector('input')!;
            expect(root.tagName).to.equal('LABEL');
            expect(Array.from(root.querySelectorAll('[data-cratis-part]')).map((part) => part.getAttribute('data-cratis-part')))
                .to.deep.equal(parts.slice(1));
            expect(root.className).to.equal('cratis-choice part-root consumer-root');
            expect(root.style.color).to.equal('blue');
            expect(root.style.margin).to.equal('2px');
            expect(root.title).to.equal('Example root');
            expect(root.htmlFor).to.equal('');
            expect([input.id, input.name, input.value]).to.deep.equal(['example-choice', 'example-group', 'example-value']);
            expect(input.className).to.equal('cratis-choice__input part-input');
            expect(input.getAttribute('aria-invalid')).to.equal('false');
            expect(input.disabled || input.readOnly || input.checked).to.equal(false);
            expect(root.querySelector('[data-cratis-part="label"]')!.className).to.equal('cratis-choice__label part-label');
            for (const part of root.querySelectorAll('[data-cratis-part]')) {
                expect(['disabled', 'selected', 'invalid', 'readonly'].map((state) => part.getAttribute(`data-${state}`)))
                    .to.deep.equal([null, null, null, null]);
            }
        });

        it('should fall back to input part identity and state without adding an absent label', () => {
            const container = document.createElement('div');
            container.innerHTML = renderToStaticMarkup(<Control name='example-group' value='example-value'
                pt={{ input: { id: 'part-id', disabled: true, readOnly: true, checked: true, 'aria-invalid': 'true' } }}
            />);
            const root = container.firstElementChild as HTMLLabelElement;
            expect(root.htmlFor).to.equal('');
            expect(root.querySelector('input')!.id).to.equal('part-id');
            expect(root.querySelector('[data-cratis-part="label"]')).to.equal(null);
            expect(root.textContent).to.equal(name === 'Checkbox' ? '✓' : '');
            for (const part of container.querySelectorAll('[data-cratis-part]')) {
                expect(['disabled', 'selected', 'invalid', 'readonly'].map((state) => part.getAttribute(`data-${state}`)))
                    .to.deep.equal(['true', 'true', 'true', 'true']);
            }
        });

        it('should invoke part handlers before public handlers with the same native event', async () => {
            const order: string[] = [];
            const onChange = vi.fn<NonNullable<CheckboxProps['onChange']>>(() => { order.push('public-change'); });
            const publicClick = vi.fn(() => order.push('public-click'));
            const partChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => { order.push('part-change'); return event.nativeEvent; });
            const ref = createRef<HTMLInputElement>();
            const mounted = await mountPrimitive(<Control ref={ref} name='example-group' value='example-value'
                onChange={onChange} onClick={publicClick}
                pt={{ input: { onClick: () => order.push('part-click'), onChange: partChange } }}
            />);
            try {
                expect(ref.current).to.equal(mounted.container.querySelector('input'));
                await act(async () => ref.current!.click());
                expect(order).to.deep.equal(['part-click', 'public-click', 'part-change', 'public-change']);
                expect(onChange.mock.calls).to.have.length(1);
                const [value, metadata] = onChange.mock.calls[0];
                expect(value).to.equal(true);
                expect(metadata!.source).to.equal('user');
                expect(metadata!.nativeEvent).to.be.instanceOf(Event);
                expect(metadata!.nativeEvent).to.equal(partChange.mock.results[0].value);
            } finally {
                await unmountPrimitive(mounted);
            }
        });

        it('should keep readonly clicks canceled after both click handlers run', async () => {
            const canceled: boolean[] = [];
            const onChange = vi.fn();
            const mounted = await mountPrimitive(<Control name='example-group' value='example-value' defaultChecked readOnly onChange={onChange}
                onClick={(event) => canceled.push(event.defaultPrevented)}
                pt={{ input: { onClick: (event) => canceled.push(event.defaultPrevented) } }}
            />);
            try {
                const input = mounted.container.querySelector('input')!;
                await act(async () => input.click());
                expect(canceled).to.deep.equal([false, false]);
                expect(input.checked).to.equal(true);
                expect(onChange.mock.calls).to.have.length(0);
            } finally {
                await unmountPrimitive(mounted);
            }
        });
    });
}
