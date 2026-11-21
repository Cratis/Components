// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import 'chai/register-should.js';
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it } from 'vitest';
import type { TextAreaProps, TextInputProps } from '@cratis/components/Common';
import { DesignsystemetTextAreaSlot, DesignsystemetTextInputSlot } from '../src/fields.js';

let root: Root | undefined;
let container: HTMLDivElement;

const render = async (element: ReactNode) => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root?.render(element));
    return container.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')!;
};

afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    root = undefined;
});

const fields = [
    {
        name: 'text input',
        Slot: (props: TextInputProps & TextAreaProps) => createElement(DesignsystemetTextInputSlot, props),
        prototype: HTMLInputElement.prototype,
    },
    {
        name: 'text area',
        Slot: (props: TextInputProps & TextAreaProps) => createElement(DesignsystemetTextAreaSlot, props),
        prototype: HTMLTextAreaElement.prototype,
    },
] as const;

for (const { name, Slot, prototype } of fields) {
    describe(`when resolving ${name} part state`, () => {
        it('should let explicit false public props override true root-part state', async () => {
            const field = await render(createElement(Slot, {
                disabled: false,
                readOnly: false,
                'aria-invalid': false,
                pt: { root: { disabled: true, readOnly: true, 'aria-invalid': true } },
            }));

            [field.disabled, field.readOnly].should.deep.equal([false, false]);
            field.getAttribute('aria-invalid')!.should.equal('false');
            container.querySelectorAll('[data-disabled], [data-readonly], [data-invalid]').length.should.equal(0);
        });

        it('should inherit native state from the root part', async () => {
            const field = await render(createElement(Slot, {
                pt: { root: { disabled: true, readOnly: true, 'aria-invalid': 'true' } },
            }));

            [field.disabled, field.readOnly].should.deep.equal([true, true]);
            for (const state of ['disabled', 'readonly', 'invalid']) {
                field.getAttribute(`data-${state}`)!.should.equal('true');
            }
        });

        it('should keep canonical invalid state even when aria-invalid is explicitly false', async () => {
            const field = await render(createElement(Slot, { invalid: true, 'aria-invalid': false }));

            field.getAttribute('aria-invalid')!.should.equal('false');
            field.getAttribute('data-invalid')!.should.equal('true');
        });

        it('should merge root styling before public styling', async () => {
            const field = await render(createElement(Slot, {
                className: 'public-field',
                style: { color: 'blue' },
                pt: { root: { className: 'part-field', style: { color: 'red', margin: '2px' } } },
            }));

            field.classList.contains('part-field').should.equal(true);
            field.classList.contains('public-field').should.equal(true);
            field.style.color.should.equal('blue');
            field.style.margin.should.equal('2px');
        });

        it('should call the root handler before the public value-first handler with the native event', async () => {
            const calls: string[] = [];
            const observed: unknown[] = [];
            const field = await render(createElement(Slot, {
                defaultValue: 'before',
                onChange: (value, meta) => {
                    calls.push('public');
                    observed.push(value, meta?.source, meta?.nativeEvent instanceof Event);
                },
                pt: { root: { onChange: () => calls.push('part') } },
            }));

            await act(async () => {
                Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(field, 'after');
                field.dispatchEvent(new Event('input', { bubbles: true }));
            });

            calls.should.deep.equal(['part', 'public']);
            observed.should.deep.equal(['after', 'user', true]);
        });
    });
}
