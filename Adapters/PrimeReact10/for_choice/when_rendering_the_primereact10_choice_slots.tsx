// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, createElement, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { primeReact10UiLibrary } from '../src/index.js';
import { withPrimeApplication } from '../given/a_prime_application.js';

type SlotId = 'common.checkbox' | 'common.radio' | 'common.switch';
const slotIds: readonly SlotId[] = ['common.checkbox', 'common.radio', 'common.switch'];

const componentFor = (slotId: SlotId) =>
    // SAFETY: The fixture props below are paired with the corresponding public slot contract.
    withPrimeApplication(primeReact10UiLibrary.slots[slotId].render as unknown as ComponentType<Record<string, unknown>>);

const inputPart = { className: 'part-input', id: 'input-id' };

const cases: Readonly<Record<string, Record<string, unknown>>> = {
    plain: {},
    label: { label: 'Option' },
    checked: { checked: true, onChange: () => undefined, label: 'Option' },
    unchecked: { checked: false, onChange: () => undefined },
    defaultChecked: { defaultChecked: true, label: 'Option' },
    disabled: { disabled: true, label: 'Option' },
    readOnly: { readOnly: true, checked: true, onChange: () => undefined },
    invalid: { invalid: true, label: 'Option' },
    ariaInvalidTrue: { 'aria-invalid': true },
    ariaInvalidString: { 'aria-invalid': 'true' },
    named: { name: 'group', value: 'a', label: 'Option' },
    nativeProps: { 'data-extra': 'x', role: 'custom', 'aria-describedby': 'other' },
    classAndStyle: { className: 'consumer', style: { color: 'red' }, label: 'Option' },
    inputPartFallbacks: {
        pt: { input: { ...inputPart, disabled: true, readOnly: true, checked: true, 'aria-invalid': true, style: { margin: 1 } } },
    },
    inputPartDefaultChecked: { pt: { input: { defaultChecked: true } } },
    explicitBeatsPart: { checked: false, disabled: false, readOnly: false, 'aria-invalid': false, onChange: () => undefined, pt: { input: { disabled: true, readOnly: true, checked: true } } },
    allParts: {
        label: 'Option',
        checked: true,
        onChange: () => undefined,
        pt: {
            root: { className: 'part-root', id: 'root-id', style: { padding: 1 } },
            label: { className: 'part-label', id: 'label-id' },
            box: { className: 'part-box', id: 'box-id' },
            indicator: { className: 'part-indicator', id: 'indicator-id' },
            control: { className: 'part-control', id: 'control-id' },
            handle: { className: 'part-handle', id: 'handle-id' },
        },
    },
};

const renderAll = (slotId: SlotId) =>
    Object.fromEntries(
        Object.entries(cases).map(([name, props]) => [name, renderToStaticMarkup(createElement(componentFor(slotId), props))]),
    );

const interact = async (slotId: SlotId, props: Record<string, unknown>) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const calls: string[] = [];
    await act(async () => {
        root.render(
            createElement(componentFor(slotId), {
                ...props,
                onChange: (checked: boolean, details: { source: string }) => calls.push(`change:${checked}:${details.source}`),
                onClick: () => calls.push('click'),
                pt: { input: { onClick: () => calls.push('part-click'), onChange: () => calls.push('part-change') } },
            }),
        );
    });
    const input = container.querySelector<HTMLInputElement>('input');
    await act(async () => input?.click());
    const checkedAfter = input?.checked;
    await act(async () => root.unmount());
    container.remove();
    return { calls, checkedAfter };
};

describe('when rendering the PrimeReact 10 choice slots', () => {
    for (const slotId of slotIds) {
        it(`should render the ${slotId} markup unchanged for every characterized input`, () => {
            expect(renderAll(slotId)).toMatchSnapshot();
        });

        it(`should notify part and consumer handlers when ${slotId} is clicked`, async () => {
            expect(await interact(slotId, {})).toMatchSnapshot();
        });

        it(`should prevent the change of a read-only ${slotId}`, async () => {
            expect(await interact(slotId, { readOnly: true, checked: false })).toMatchSnapshot();
        });
    }
});
