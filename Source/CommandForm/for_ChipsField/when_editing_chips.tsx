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

import { ChipsField } from '../fields/ChipsField';

describe('when editing chips', () => {
    let container: HTMLDivElement;
    let root: Root;
    let changes: string[][];

    beforeEach(() => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        changes = [];
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const renderField = async (props: Record<string, unknown>) => {
        const Field = ChipsField as unknown as ComponentType<Record<string, unknown>>;
        await act(async () => {
            root.render(
                <Field
                    invalid={false}
                    required={false}
                    errors={[]}
                    value={[]}
                    onChange={(value: string[]) => changes.push(value)}
                    {...props}
                />,
            );
        });
    };

    const input = () => container.querySelector<HTMLInputElement>('input')!;

    const type = async (text: string) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
        await act(async () => {
            setter.call(input(), text);
            input().dispatchEvent(new Event('input', { bubbles: true }));
        });
    };

    const pressEnter = async () => {
        await act(async () => {
            input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        });
    };

    it('should add the typed value on Enter and clear the draft', async () => {
        await renderField({ value: ['a'] });
        await type(' b ');
        await pressEnter();
        changes.should.deep.equal([['a', 'b']]);
        expect(input().value).to.equal('');
    });

    it('should add nothing on Enter when the draft is blank', async () => {
        await renderField({});
        await type('   ');
        await pressEnter();
        changes.should.deep.equal([]);
    });

    it('should split the draft on the separator', async () => {
        await renderField({ separator: ',' });
        await type('x, y,,z');
        await pressEnter();
        changes.should.deep.equal([['x', 'y', 'z']]);
    });

    it('should respect the maximum and the duplicate setting', async () => {
        await renderField({ value: ['a'], max: 2, separator: ',' });
        await type('a,b,c');
        await pressEnter();
        changes.should.deep.equal([['a', 'b']]);

        changes = [];
        await renderField({ value: ['a'], allowDuplicate: true });
        await type('a');
        await pressEnter();
        changes.should.deep.equal([['a', 'a']]);
    });

    it('should remove the chip whose button is clicked', async () => {
        await renderField({ value: ['a', 'b', 'c'] });
        const buttons = container.querySelectorAll<HTMLButtonElement>('button');
        await act(async () => buttons[1].click());
        changes.should.deep.equal([['a', 'c']]);
    });

    it('should label remove buttons from a function, a shared label, or the default', async () => {
        await renderField({ value: ['a'], removeAriaLabel: (item: string, index: number) => `drop ${item} ${index}` });
        container.querySelector('button')!.getAttribute('aria-label')!.should.equal('drop a 0');
        await renderField({ value: ['a'], removeAriaLabel: 'Fjern' });
        container.querySelector('button')!.getAttribute('aria-label')!.should.equal('Fjern');
        await renderField({ value: ['a'] });
        container.querySelector('button')!.getAttribute('aria-label')!.should.equal('Remove a');
    });

    it('should add on blur only when addOnBlur is set and focus leaves the field', async () => {
        const blurred: boolean[] = [];
        await renderField({ addOnBlur: true, onBlur: () => blurred.push(true) });
        await type('q');
        await act(async () => {
            input().dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
        });
        changes.should.deep.equal([['q']]);
        blurred.should.deep.equal([true]);

        changes = [];
        await renderField({ addOnBlur: false });
        await type('r');
        await act(async () => {
            input().dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
        });
        changes.should.deep.equal([]);
    });
});
