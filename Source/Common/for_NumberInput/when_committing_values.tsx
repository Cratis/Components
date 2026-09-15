// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { NumberInputCommitReason } from '../NumberInputCommitReason';
import { unmountPrimitive } from '../for_Primitives/given/a_primitive_dom';
import {
    blurNumberInput,
    editNumberInput,
    mountNumberInput,
    pasteNumberInput,
    pressNumberInputKey,
    type MountedNumberInput,
} from './given/a_number_input';

const formatted = async (
    minimumFractionDigits: number,
    maximumFractionDigits: number,
    value = 12.345,
) => {
    const mounted = await mountNumberInput({
        initialValue: value,
        'aria-label': 'Amount',
        minimumFractionDigits,
        maximumFractionDigits,
    });
    const result = mounted.input.value;
    await unmountPrimitive(mounted);
    return result;
};

describe('when committing number values', () => {
    let mounted: MountedNumberInput | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    it('should format zero, one, two, and ranged fraction policies', async () => {
        expect(await formatted(0, 0)).to.equal('12');
        expect(await formatted(1, 1)).to.equal('12.3');
        expect(await formatted(2, 2)).to.equal('12.35');
        expect(await formatted(0, 2, 12.3)).to.equal('12.3');
    });

    it('should clamp and snap committed text to min, max, and step', async () => {
        const numberInput = await mountNumberInput({
            initialValue: 50,
            'aria-label': 'Percentage',
            min: 10,
            max: 100,
            step: 10,
        });
        mounted = numberInput;

        await editNumberInput(numberInput, '107');
        await pressNumberInputKey(numberInput, 'Enter');
        await editNumberInput(numberInput, '3');
        await pressNumberInputKey(numberInput, 'Enter');

        expect(numberInput.events).to.deep.equal([
            { kind: 'change', value: 100 },
            {
                kind: 'commit',
                value: 100,
                reason: NumberInputCommitReason.Enter,
            },
            { kind: 'change', value: 10 },
            {
                kind: 'commit',
                value: 10,
                reason: NumberInputCommitReason.Enter,
            },
        ]);
        expect(numberInput.input.value).to.equal('10');
    });

    it('should reconcile an out-of-range controlled value before form submission', async () => {
        const numberInput = await mountNumberInput({
            initialValue: 101,
            'aria-label': 'Percentage',
            name: 'percentage',
            max: 100,
            insideForm: true,
        });
        mounted = numberInput;

        expect(numberInput.events).to.deep.equal([{ kind: 'change', value: 100 }]);
        expect(numberInput.input.value).to.equal('100');
        expect(new FormData(numberInput.form).get('percentage')).to.equal('100');
    });

    it('should withhold a normalized form value until the controlled owner accepts it', async () => {
        const numberInput = await mountNumberInput({
            initialValue: 101,
            'aria-label': 'Percentage',
            name: 'percentage',
            max: 100,
            acceptChanges: false,
            insideForm: true,
        });
        mounted = numberInput;

        expect(numberInput.events).to.deep.equal([{ kind: 'change', value: 100 }]);
        expect(numberInput.input.value).to.equal('101');
        expect(new FormData(numberInput.form).has('percentage')).to.equal(false);
    });

    it('should reconcile controlled fraction precision with display and form values', async () => {
        const numberInput = await mountNumberInput({
            initialValue: 12.345,
            'aria-label': 'Amount',
            name: 'amount',
            maximumFractionDigits: 2,
            insideForm: true,
        });
        mounted = numberInput;

        expect(numberInput.events).to.deep.equal([{ kind: 'change', value: 12.35 }]);
        expect(numberInput.input.value).to.equal('12.35');
        expect(new FormData(numberInput.form).get('amount')).to.equal('12.35');
    });

    it('should keep a committed locale fraction valid for native form submission', async () => {
        const numberInput = await mountNumberInput({
            initialValue: null,
            'aria-label': 'Amount',
            name: 'amount',
            maximumFractionDigits: 2,
            insideForm: true,
        });
        mounted = numberInput;

        await editNumberInput(numberInput, '12.5');
        await pressNumberInputKey(numberInput, 'Enter');

        expect(numberInput.form?.checkValidity()).to.equal(true);
        expect(new FormData(numberInput.form).get('amount')).to.equal('12.5');
    });

    it('should increment and decrement by integer and fractional steps', async () => {
        for (const step of [1, 0.1, 0.01]) {
            const numberInput = await mountNumberInput({
                initialValue: 1,
                'aria-label': `Step ${step}`,
                step,
                maximumFractionDigits: 2,
            });
            await pressNumberInputKey(numberInput, 'ArrowUp');
            await pressNumberInputKey(numberInput, 'ArrowDown');
            expect(numberInput.events.map((entry) => entry.value)).to.deep.equal([
                1 + step,
                1 + step,
                1,
                1,
            ]);
            await unmountPrimitive(numberInput);
        }
    });

    it('should let Tab move focus and commit once through blur', async () => {
        const numberInput = await mountNumberInput({
            initialValue: 2,
            'aria-label': 'Quantity',
        });
        mounted = numberInput;

        await editNumberInput(numberInput, '3');
        await pressNumberInputKey(numberInput, 'Tab');
        expect(numberInput.events).to.deep.equal([]);
        await blurNumberInput(numberInput);

        expect(numberInput.events).to.deep.equal([
            { kind: 'change', value: 3 },
            {
                kind: 'commit',
                value: 3,
                reason: NumberInputCommitReason.Blur,
            },
        ]);
    });

    it('should order change before commit for paste, arrows, Enter, and blur', async () => {
        const numberInput = await mountNumberInput({
            initialValue: null,
            'aria-label': 'Quantity',
            min: 0,
            max: 20,
        });
        mounted = numberInput;

        const pasteTransaction = await pasteNumberInput(numberInput, '4');
        expect(pasteTransaction).to.deep.equal([
            { kind: 'change', value: 4 },
            {
                kind: 'commit',
                value: 4,
                reason: NumberInputCommitReason.Paste,
            },
        ]);
        await pressNumberInputKey(numberInput, 'ArrowUp');
        await editNumberInput(numberInput, '8');
        await pressNumberInputKey(numberInput, 'Enter');
        await editNumberInput(numberInput, '9');
        await blurNumberInput(numberInput);

        expect(numberInput.events).to.deep.equal([
            { kind: 'change', value: 4 },
            {
                kind: 'commit',
                value: 4,
                reason: NumberInputCommitReason.Paste,
            },
            { kind: 'change', value: 5 },
            {
                kind: 'commit',
                value: 5,
                reason: NumberInputCommitReason.Step,
            },
            { kind: 'change', value: 8 },
            {
                kind: 'commit',
                value: 8,
                reason: NumberInputCommitReason.Enter,
            },
            { kind: 'change', value: 9 },
            {
                kind: 'commit',
                value: 9,
                reason: NumberInputCommitReason.Blur,
            },
        ]);
    });

    it('should apply the same step order from the visible buttons', async () => {
        const numberInput = await mountNumberInput({
            initialValue: 2,
            'aria-label': 'Quantity',
            step: 2,
        });
        mounted = numberInput;

        await act(async () => {
            numberInput.stepButtons[1].click();
            await Promise.resolve();
        });
        await act(async () => {
            numberInput.stepButtons[0].click();
            await Promise.resolve();
        });

        expect(numberInput.events).to.deep.equal([
            { kind: 'change', value: 4 },
            {
                kind: 'commit',
                value: 4,
                reason: NumberInputCommitReason.Step,
            },
            { kind: 'change', value: 2 },
            {
                kind: 'commit',
                value: 2,
                reason: NumberInputCommitReason.Step,
            },
        ]);
    });
});
