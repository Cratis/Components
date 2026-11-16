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

import { PasswordField } from '../fields/PasswordField';

describe('when toggling password visibility', () => {
    let container: HTMLDivElement;
    let root: Root;
    let changes: string[];
    let blurs: number;

    beforeEach(() => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        changes = [];
        blurs = 0;
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const renderField = async (props: Record<string, unknown> = {}) => {
        const Field = PasswordField as unknown as ComponentType<Record<string, unknown>>;
        await act(async () => {
            root.render(
                <Field
                    invalid={false}
                    required={false}
                    errors={[]}
                    value='secret'
                    onChange={(value: string) => changes.push(value)}
                    onBlur={() => blurs++}
                    {...props}
                />,
            );
        });
    };

    const input = () => container.querySelector<HTMLInputElement>('input')!;
    const toggle = () => container.querySelector<HTMLButtonElement>('button')!;
    const fieldRoot = () => container.querySelector<HTMLElement>('[data-cratis-part="root"]')!;

    const clickToggle = async () => {
        await act(async () => {
            toggle().click();
        });
    };

    it('should mask the value initially with the default show label', async () => {
        await renderField();
        expect(input().type).to.equal('password');
        expect(toggle().getAttribute('aria-label')).to.equal('Show password');
    });

    it('should reveal the value and offer the default hide label after a click', async () => {
        await renderField();
        await clickToggle();
        expect(input().type).to.equal('text');
        expect(toggle().getAttribute('aria-label')).to.equal('Hide password');
    });

    it('should mask the value again after a second click', async () => {
        await renderField();
        await clickToggle();
        await clickToggle();
        expect(input().type).to.equal('password');
    });

    it('should use custom labels', async () => {
        await renderField({ showLabel: 'Reveal', hideLabel: 'Conceal' });
        expect(toggle().getAttribute('aria-label')).to.equal('Reveal');
        await clickToggle();
        expect(toggle().getAttribute('aria-label')).to.equal('Conceal');
    });

    it('should report typed values through onChange', async () => {
        await renderField();
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
        await act(async () => {
            setter.call(input(), 'abc');
            input().dispatchEvent(new Event('input', { bubbles: true }));
        });
        changes.should.deep.equal(['abc']);
    });

    it('should join class names from the field and the parts', async () => {
        await renderField({
            className: 'extra',
            pt: {
                root: { className: 'root-part' },
                input: { className: 'input-part' },
                toggle: { className: 'toggle-part' },
            },
        });
        expect(fieldRoot().className).to.equal('cratis-password-field cratis:w-full root-part extra');
        expect(input().className).to.equal('cratis-field-input cratis:w-full input-part');
        expect(toggle().className).to.equal('cratis-password-field__toggle toggle-part');
    });

    it('should use the plain class names when no parts are given', async () => {
        await renderField();
        expect(fieldRoot().className).to.equal('cratis-password-field cratis:w-full');
        expect(input().className).to.equal('cratis-field-input cratis:w-full');
        expect(toggle().className).to.equal('cratis-password-field__toggle');
    });

    it('should mirror state attributes on the root and the input', async () => {
        await renderField({
            invalid: true,
            pt: { input: { disabled: true, readOnly: true }, toggle: { disabled: true } },
        });
        for (const element of [fieldRoot(), input()]) {
            expect(element.hasAttribute('data-disabled')).to.equal(true);
            expect(element.hasAttribute('data-invalid')).to.equal(true);
            expect(element.hasAttribute('data-readonly')).to.equal(true);
        }
        expect(input().getAttribute('aria-invalid')).to.equal('true');
        expect(toggle().hasAttribute('data-disabled')).to.equal(true);
    });

    it('should omit state attributes when the field is valid and editable', async () => {
        await renderField();
        expect(fieldRoot().hasAttribute('data-invalid')).to.equal(false);
        expect(input().hasAttribute('aria-invalid')).to.equal(false);
        expect(toggle().hasAttribute('data-disabled')).to.equal(false);
    });

    it('should forward blur from the root', async () => {
        await renderField();
        await act(async () => {
            input().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        });
        expect(blurs).to.equal(1);
    });
});
