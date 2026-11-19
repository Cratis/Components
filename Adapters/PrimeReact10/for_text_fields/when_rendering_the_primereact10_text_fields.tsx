// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, createElement, createRef, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { primeReact10UiLibrary } from '../src/index.js';
import { withPrimeApplication } from '../given/a_prime_application.js';

type SlotId = 'common.textInput' | 'common.textArea';

const componentFor = (slotId: SlotId) =>
    // SAFETY: The fixture props below are paired with the corresponding public slot contract.
    withPrimeApplication(primeReact10UiLibrary.slots[slotId].render as unknown as ComponentType<Record<string, unknown>>);

const cases: Readonly<Record<string, Record<string, unknown>>> = {
    plain: {},
    value: { value: 'text', onChange: () => undefined },
    defaultValue: { defaultValue: 'text', placeholder: 'Type' },
    invalid: { invalid: true },
    ariaInvalidTrue: { 'aria-invalid': true },
    ariaInvalidString: { 'aria-invalid': 'true' },
    ariaInvalidFalse: { 'aria-invalid': false, invalid: true },
    disabled: { disabled: true },
    readOnly: { readOnly: true },
    partFallbacks: { pt: { root: { disabled: true, readOnly: true, 'aria-invalid': true, id: 'root' } } },
    explicitBeatsPart: { disabled: false, readOnly: false, 'aria-invalid': false, pt: { root: { disabled: true, readOnly: true, 'aria-invalid': true } } },
    classAndStyle: { className: 'consumer', style: { color: 'red' }, pt: { root: { className: 'part', style: { margin: 1 } } } },
    typePassword: { type: 'password' },
    nativeProps: { name: 'field', 'data-extra': 'x', maxLength: 4 },
};

const renderAll = (slotId: SlotId) =>
    Object.fromEntries(
        Object.entries(cases).map(([name, props]) => [name, renderToStaticMarkup(createElement(componentFor(slotId), props))]),
    );

const typeAndNotify = async (slotId: SlotId) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const ref = createRef<HTMLInputElement & HTMLTextAreaElement>();
    const calls: string[] = [];
    await act(async () => {
        root.render(
            createElement(componentFor(slotId), {
                ref,
                onChange: (value: string, details: { source: string }) => calls.push(`value:${value}:${details.source}`),
                pt: { root: { onChange: () => calls.push('part') } },
            }),
        );
    });
    const element = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(slotId === 'common.textInput' ? 'input' : 'textarea');
    const prototype = slotId === 'common.textInput' ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    await act(async () => {
        setter?.call(element, 'typed');
        element?.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const sameElement = ref.current === element;
    await act(async () => root.unmount());
    container.remove();
    return { calls, sameElement };
};

describe('when rendering the PrimeReact 10 text fields', () => {
    it('should render the text input markup unchanged for every characterized input', () => {
        expect(renderAll('common.textInput')).toMatchSnapshot();
    });

    it('should render the text area markup unchanged for every characterized input', () => {
        expect(renderAll('common.textArea')).toMatchSnapshot();
    });

    it('should notify the part handler before the value handler for the text input', async () => {
        expect(await typeAndNotify('common.textInput')).toEqual({ calls: ['part', 'value:typed:user'], sameElement: true });
    });

    it('should notify the part handler before the value handler for the text area', async () => {
        expect(await typeAndNotify('common.textArea')).toEqual({ calls: ['part', 'value:typed:user'], sameElement: true });
    });
});
