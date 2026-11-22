// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { NumberInput } from '../NumberInput';
import { mountPrimitive, unmountPrimitive, type MountedPrimitive } from '../for_Primitives/given/a_primitive_dom';
import { mountNumberInput } from './given/a_number_input';

describe('when normalizing controlled number values', () => {
    let mounted: MountedPrimitive | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    it('should snap relative to the minimum without stepping beyond a nonaligned maximum', async () => {
        const numberInput = await mountNumberInput({
            initialValue: 12,
            min: 1,
            max: 10,
            step: 4,
            'aria-label': 'Sample quantity',
        });
        mounted = numberInput;
        expect(numberInput.events).to.deep.equal([{ kind: 'change', value: 9 }]);
        expect(numberInput.input.value).to.equal('9');
    });

    it('should request a rejected normalization only once until the controlled value changes', async () => {
        const changes: (number | null)[] = [];
        const render = (value: number) => <NumberInput value={value} max={10} aria-label='Sample quantity' onChange={next => changes.push(next)} />;
        mounted = await mountPrimitive(render(12));
        await act(async () => mounted!.root.render(render(12)));
        expect(changes).to.deep.equal([10]);
        await act(async () => mounted!.root.render(render(8)));
        await act(async () => mounted!.root.render(render(12)));
        expect(changes).to.deep.equal([10, 10]);
    });
});
