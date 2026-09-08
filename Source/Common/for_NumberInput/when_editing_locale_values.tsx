// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useState } from 'react';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { NumberInput } from '../NumberInput';
import { NumberInputCommitReason } from '../NumberInputCommitReason';
import {
    mountPrimitive,
    unmountPrimitive,
    type MountedPrimitive,
} from '../for_Primitives/given/a_primitive_dom';
import {
    blurNumberInput,
    editNumberInput,
    mountNumberInput,
    pasteNumberInput,
    pressNumberInputKey,
    type MountedNumberInput,
} from './given/a_number_input';

const normalizedSpaces = (value: string) => value.replace(/[\u00a0\u202f]/gu, ' ');

const localizedFixture = (locale: string) =>
    mountNumberInput({
        initialValue: null,
        providerLocale: locale,
        'aria-label': 'Amount',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

describe('when editing locale-aware number values', () => {
    let mounted: MountedNumberInput | MountedPrimitive | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    it('should parse and group typed nb-NO decimal text without emitting during the edit', async () => {
        const numberInput = await localizedFixture('nb-NO');
        mounted = numberInput;

        await editNumberInput(numberInput, '1234,50');
        expect(numberInput.events).to.deep.equal([]);
        await pressNumberInputKey(numberInput, 'Enter');

        expect(numberInput.events).to.deep.equal([
            { kind: 'change', value: 1234.5 },
            {
                kind: 'commit',
                value: 1234.5,
                reason: NumberInputCommitReason.Enter,
            },
        ]);
        expect(normalizedSpaces(numberInput.input.value)).to.equal('1 234,50');
    });

    it('should parse grouped and ungrouped nb-NO full-field paste', async () => {
        const numberInput = await localizedFixture('nb-NO');
        mounted = numberInput;

        await pasteNumberInput(numberInput, '1\u00a0234,50');
        await pasteNumberInput(numberInput, '1234,50');

        expect(numberInput.events).to.deep.equal([
            { kind: 'change', value: 1234.5 },
            {
                kind: 'commit',
                value: 1234.5,
                reason: NumberInputCommitReason.Paste,
            },
            {
                kind: 'commit',
                value: 1234.5,
                reason: NumberInputCommitReason.Paste,
            },
        ]);
        expect(normalizedSpaces(numberInput.input.value)).to.equal('1 234,50');
    });

    it('should parse grouped nb-NO and ungrouped en-US typed text', async () => {
        const norwegian = await localizedFixture('nb-NO');
        await editNumberInput(norwegian, '1\u00a0234,50');
        await pressNumberInputKey(norwegian, 'Enter');
        expect(norwegian.events[0]).to.deep.equal({
            kind: 'change',
            value: 1234.5,
        });
        await unmountPrimitive(norwegian);

        const american = await localizedFixture('en-US');
        mounted = american;
        await editNumberInput(american, '1234.50');
        await pressNumberInputKey(american, 'Enter');
        expect(american.events[0]).to.deep.equal({
            kind: 'change',
            value: 1234.5,
        });
    });

    it('should parse and group typed en-US decimal text', async () => {
        const numberInput = await localizedFixture('en-US');
        mounted = numberInput;

        await editNumberInput(numberInput, '1,234.50');
        await blurNumberInput(numberInput);

        expect(numberInput.events).to.deep.equal([
            { kind: 'change', value: 1234.5 },
            {
                kind: 'commit',
                value: 1234.5,
                reason: NumberInputCommitReason.Blur,
            },
        ]);
        expect(numberInput.input.value).to.equal('1,234.50');
    });

    it('should parse grouped and ungrouped en-US full-field paste', async () => {
        const numberInput = await localizedFixture('en-US');
        mounted = numberInput;

        await pasteNumberInput(numberInput, '1,234.50');
        await pasteNumberInput(numberInput, '1234.50');

        expect(numberInput.events).to.deep.equal([
            { kind: 'change', value: 1234.5 },
            {
                kind: 'commit',
                value: 1234.5,
                reason: NumberInputCommitReason.Paste,
            },
            {
                kind: 'commit',
                value: 1234.5,
                reason: NumberInputCommitReason.Paste,
            },
        ]);
        expect(numberInput.input.value).to.equal('1,234.50');
    });

    it('should retain null through incomplete minus and decimal edits', async () => {
        const numberInput = await localizedFixture('nb-NO');
        mounted = numberInput;

        for (const text of ['-', ',']) {
            await editNumberInput(numberInput, text);
            expect(numberInput.events).to.deep.equal([]);
            await pressNumberInputKey(numberInput, 'Enter');
            expect(numberInput.events.at(-1)).to.deep.equal({
                kind: 'commit',
                value: null,
                reason: NumberInputCommitReason.Enter,
            });
            expect(numberInput.input.value).to.equal('');
            numberInput.events.length = 0;
        }
    });

    it('should emit null rather than zero or NaN when cleared', async () => {
        const numberInput = await mountNumberInput({
            initialValue: 42,
            providerLocale: 'en-US',
            'aria-label': 'Quantity',
        });
        mounted = numberInput;

        await editNumberInput(numberInput, '');
        expect(numberInput.events).to.deep.equal([]);
        await blurNumberInput(numberInput);

        expect(numberInput.events).to.deep.equal([
            { kind: 'change', value: null },
            {
                kind: 'commit',
                value: null,
                reason: NumberInputCommitReason.Blur,
            },
        ]);
        expect(numberInput.events.some((entry) => Number.isNaN(entry.value))).to.equal(
            false,
        );
    });

    it('should reformat an unchanged controlled number when the locale changes', async () => {
        let setLocale: ((locale: string) => void) | undefined;
        const changes: Array<number | null> = [];
        const LocaleHarness = () => {
            const [locale, updateLocale] = useState('en-US');
            setLocale = updateLocale;
            return (
                <CratisComponentsProvider value={{ locale }}>
                    <NumberInput
                        value={1234.5}
                        onChange={(value) => changes.push(value)}
                        aria-label='Amount'
                        minimumFractionDigits={2}
                        maximumFractionDigits={2}
                    />
                </CratisComponentsProvider>
            );
        };
        mounted = await mountPrimitive(<LocaleHarness />);
        const input = mounted.container.querySelector<HTMLInputElement>(
            'input[data-cratis-part="input"]',
        )!;
        expect(input.value).to.equal('1,234.50');

        await act(async () => setLocale?.('nb-NO'));

        expect(normalizedSpaces(input.value)).to.equal('1 234,50');
        expect(changes).to.deep.equal([]);
    });

    it('should prefer a valid locale override and fall back from an invalid override', async () => {
        const overridden = await mountNumberInput({
            initialValue: 1234.5,
            providerLocale: 'nb-NO',
            locale: 'en-US',
            'aria-label': 'Amount',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        expect(overridden.input.value).to.equal('1,234.50');
        await unmountPrimitive(overridden);

        const fallback = await mountNumberInput({
            initialValue: 1234.5,
            providerLocale: 'nb-NO',
            locale: 'not_a_locale',
            'aria-label': 'Amount',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        mounted = fallback;
        expect(normalizedSpaces(fallback.input.value)).to.equal('1 234,50');
    });
});
