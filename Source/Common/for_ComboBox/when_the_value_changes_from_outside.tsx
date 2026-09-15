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

let setValueFromOutside: (value: string | null) => void = () => undefined;
let setOptionsFromOutside: (options: ComboBoxOption[]) => void = () => undefined;

const Host = ({
    initialValue,
    initialOptions,
}: {
    initialValue: string | null;
    initialOptions: ComboBoxOption[];
}) => {
    const [value, setValue] = useState<string | null>(initialValue);
    const [options, setOptions] = useState(initialOptions);
    setValueFromOutside = setValue;
    setOptionsFromOutside = setOptions;
    return (
        <CratisComponentsProvider value={{ locale: 'en-US' }}>
            <ComboBox
                aria-label='Customer'
                options={options}
                value={value}
                onChange={setValue}
            />
        </CratisComponentsProvider>
    );
};

const input = (mounted: MountedPrimitive) =>
    mounted.container.querySelector<HTMLInputElement>('input[data-cratis-part="input"]')!;

describe('when the value changes from outside', () => {
    let mounted: MountedPrimitive | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    it('should show the new selection and clear on reset', async () => {
        mounted = await mountPrimitive(
            <Host initialValue='acme' initialOptions={roster} />,
        );
        expect(input(mounted).value).to.equal('Acme AS');

        await act(async () => setValueFromOutside('birk'));
        expect(input(mounted).value).to.equal('Birk Consulting');

        await act(async () => setValueFromOutside(null));
        expect(input(mounted).value).to.equal('');
    });

    it('should show a preselected value once its option arrives', async () => {
        mounted = await mountPrimitive(
            <Host initialValue='cirrus' initialOptions={[]} />,
        );
        expect(input(mounted).value).to.equal('');

        await act(async () => setOptionsFromOutside(roster));
        expect(input(mounted).value).to.equal('Cirrus Cloud');
    });

    it('should not replace what the user is typing when the options arrive', async () => {
        mounted = await mountPrimitive(
            <Host initialValue='cirrus' initialOptions={[]} />,
        );
        const field = input(mounted);
        await act(async () => {
            field.focus();
            field.dispatchEvent(new FocusEvent('focus'));
            field.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
            );
            await Promise.resolve();
        });
        await act(async () => {
            Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value',
            )!.set!.call(field, 'bi');
            field.dispatchEvent(new Event('input', { bubbles: true }));
        });
        expect(field.value).to.equal('bi');

        await act(async () => setOptionsFromOutside(roster));

        expect(field.value).to.equal('bi');
    });
});
