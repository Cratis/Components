// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import { act, useState } from 'react';
import { afterEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { ComboBox } from '../ComboBox';
import {
    mountPrimitive,
    setNativeValue,
    unmountPrimitive,
    type MountedPrimitive,
} from '../for_Primitives/given/a_primitive_dom';
import { roster } from './given/a_combobox';

const Host = ({ initialValue }: { initialValue: string | null }) => {
    const [value, setValue] = useState<string | null>(initialValue);
    const [text, setText] = useState(
        roster.find((option) => option.key === initialValue)?.label ?? '',
    );
    return (
        <CratisComponentsProvider value={{ locale: 'en-US' }}>
            <ComboBox
                aria-label='Customer'
                options={roster}
                value={value}
                onChange={setValue}
                inputValue={text}
                onInputChange={setText}
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

describe('when the input text is controlled', () => {
    let mounted: MountedPrimitive | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    it('should offer every option when the list opens and narrow once text is typed', async () => {
        mounted = await mountPrimitive(<Host initialValue='acme' />);
        const field = input(mounted);
        expect(field.value).to.equal('Acme AS');

        await act(async () => {
            field.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
            );
            await Promise.resolve();
        });
        expect(labels()).to.deep.equal(['Acme AS', 'Birk Consulting', 'Cirrus Cloud']);

        await setNativeValue(field, 'ci');

        expect(field.value).to.equal('ci');
        expect(labels()).to.deep.equal(['Cirrus Cloud']);
    });
});
