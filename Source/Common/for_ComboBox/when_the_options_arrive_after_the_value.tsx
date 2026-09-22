// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import { act, useState } from 'react';
import { afterEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { ComboBox, type ComboBoxOption } from '../ComboBox';
import {
    mountPrimitive,
    unmountPrimitive,
    type MountedPrimitive,
} from '../for_Primitives/given/a_primitive_dom';
import { roster } from './given/a_combobox';

let setOptionsFromOutside: (options: ComboBoxOption[]) => void = () => undefined;

const Host = () => {
    const [value, setValue] = useState<string | null>('acme');
    const [options, setOptions] = useState<ComboBoxOption[]>([]);
    setOptionsFromOutside = setOptions;
    return (
        <CratisComponentsProvider value={{ locale: 'en-US' }}>
            <ComboBox
                aria-label='Customer'
                options={options}
                value={value}
                onChange={setValue}
                openOnFocus
            />
        </CratisComponentsProvider>
    );
};

const input = (mounted: MountedPrimitive) =>
    mounted.container.querySelector<HTMLInputElement>('input[data-cratis-part="input"]')!;
const labels = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-cratis-part="option"]')).map(
        (option) =>
            option.querySelector('[data-cratis-part="optionLabel"]')?.textContent,
    );

describe('when the options arrive after the value', () => {
    let mounted: MountedPrimitive | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    it('should offer every option that arrived, with the preselected label in the input', async () => {
        mounted = await mountPrimitive(<Host />);
        const field = input(mounted);
        expect(field.value).to.equal('');

        await act(async () => setOptionsFromOutside(roster));
        expect(field.value).to.equal('Acme AS');

        await act(async () => {
            field.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
            );
            await Promise.resolve();
        });

        expect(labels()).to.deep.equal(['Acme AS', 'Birk Consulting', 'Cirrus Cloud']);
    });

    it('should offer every option when the list was already open as they arrived', async () => {
        mounted = await mountPrimitive(<Host />);
        const field = input(mounted);

        await act(async () => {
            field.focus();
            field.dispatchEvent(new FocusEvent('focus', { bubbles: false }));
            field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            await Promise.resolve();
        });
        expect(field.getAttribute('aria-expanded')).to.equal('true');

        await act(async () => setOptionsFromOutside(roster));

        expect(labels()).to.deep.equal(['Acme AS', 'Birk Consulting', 'Cirrus Cloud']);
    });
});
