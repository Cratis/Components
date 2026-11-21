// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import 'chai/register-should.js';
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it } from 'vitest';
import { DesignsystemetCheckboxSlot, DesignsystemetRadioSlot, DesignsystemetSwitchSlot } from '../src/choice.js';

let root: Root | undefined;
let container: HTMLDivElement;

const render = async (element: ReactNode) => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root?.render(element));
    return container.querySelector('input')!;
};

afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    root = undefined;
});

const slots = [
    { name: 'checkbox', Slot: DesignsystemetCheckboxSlot },
    { name: 'radio', Slot: DesignsystemetRadioSlot },
    { name: 'switch', Slot: DesignsystemetSwitchSlot },
] as const;

for (const { name, Slot } of slots) {
    describe(`when resolving ${name} part state`, () => {
        it('should let explicit false public props override true input-part state', async () => {
            const input = await render(createElement(Slot, {
                id: 'public-choice',
                name: 'example-choice',
                value: 'selected',
                label: 'Example choice',
                checked: false,
                disabled: false,
                readOnly: false,
                'aria-invalid': false,
                onChange: () => undefined,
                pt: { input: { id: 'part-choice', checked: true, disabled: true, readOnly: true, 'aria-invalid': true } },
            }));

            [input.checked, input.disabled, input.readOnly].should.deep.equal([false, false, false]);
            input.getAttribute('aria-invalid')!.should.equal('false');
            input.id.should.equal('public-choice');
            container.querySelector('label')!.htmlFor.should.equal('public-choice');
            container.querySelectorAll('[data-selected], [data-disabled], [data-readonly], [data-invalid]').length.should.equal(0);
        });

        it('should inherit native state and label association from the input part', async () => {
            const input = await render(createElement(Slot, {
                label: 'Example choice',
                name: 'example-choice',
                value: 'selected',
                pt: { input: { id: 'part-choice', checked: true, disabled: true, readOnly: true, 'aria-invalid': 'true' } },
            }));

            [input.checked, input.disabled, input.readOnly].should.deep.equal([true, true, true]);
            container.querySelector('label')!.htmlFor.should.equal('part-choice');
            for (const part of container.querySelectorAll('[data-cratis-part]')) {
                for (const state of ['selected', 'disabled', 'readonly', 'invalid']) {
                    part.hasAttribute(`data-${state}`).should.equal(true);
                }
            }
        });

        it('should preserve click order and run the part change before the value-first callback', async () => {
            const calls: string[] = [];
            const observed: unknown[] = [];
            const input = await render(createElement(Slot, {
                label: 'Example choice',
                name: 'example-choice',
                value: 'selected',
                defaultChecked: false,
                onClick: () => calls.push('public-click'),
                onChange: (checked, meta) => {
                    calls.push('public-change');
                    observed.push(checked, meta?.source, meta?.nativeEvent instanceof Event);
                },
                pt: { input: {
                    onClick: () => calls.push('part-click'),
                    onChange: () => calls.push('part-change'),
                } },
            }));

            await act(async () => input.click());

            calls.should.deep.equal(['part-click', 'public-click', 'part-change', 'public-change']);
            observed.should.deep.equal([true, 'user', true]);
            input.checked.should.equal(true);
            container.querySelector('[data-cratis-part="root"]')!.hasAttribute('data-selected').should.equal(true);
        });

        it('should prevent read-only user changes', async () => {
            let changes = 0;
            const input = await render(createElement(Slot, {
                label: 'Example choice',
                name: 'example-choice',
                value: 'selected',
                defaultChecked: false,
                readOnly: true,
                onChange: () => { changes += 1; },
            }));

            await act(async () => input.click());

            changes.should.equal(0);
            input.checked.should.equal(false);
            container.querySelectorAll('[data-selected]').length.should.equal(0);
        });
    });
}
