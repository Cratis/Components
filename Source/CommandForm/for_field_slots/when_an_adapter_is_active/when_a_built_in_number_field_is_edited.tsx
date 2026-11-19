// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import sinon from 'sinon';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import type {} from 'chai/register-should';

vi.mock('@cratis/arc.react/commands', () => ({
    asCommandFormField: (component: unknown) => component,
}));

import { arcProps, asDirectComponent } from '../given/field_cases';
import { NumberField } from '../../fields/NumberField';

const Field = asDirectComponent(NumberField);

[
    { entry: '7', expected: 7 },
    { entry: '', expected: 0 },
    { entry: 'abc', expected: 0 },
].forEach(({ entry, expected }) => {
    describe(`when "${entry}" is typed into a built-in number field`, () => {
        let container: HTMLDivElement;
        let root: Root;
        const onChange = sinon.spy();

        beforeEach(async () => {
            (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
            container = document.createElement('div');
            document.body.append(container);
            root = createRoot(container);
            await act(async () => root.render(<Field {...arcProps} value={1} onChange={onChange} />));
            const input = container.querySelector('input')!;
            await act(async () => {
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, entry);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });
        afterEach(async () => {
            await act(async () => root.unmount());
            container.remove();
        });

        it('should report the command number', () => (onChange.lastCall.args[0] as number).should.equal(expected));
    });
});
