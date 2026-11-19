// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import type {} from 'chai/register-should';

vi.mock('@cratis/arc.react/commands', () => ({
    asCommandFormField: (component: unknown) => component,
}));

import { a_field_host } from '../given/a_field_host';
import { slotCalls } from '../given/a_stub_adapter';

type NumberSlotProps = {
    value: number;
    min: number;
    max: number;
    step: number;
    invalid: boolean;
    id: string;
    className?: string;
    'aria-label': string;
    'aria-describedby': string;
    pt: { root: { className: string; disabled: boolean; readOnly: boolean } };
};

describe('when rendering a number field with a value, bounds and parts under an adapter', () => {
    const host = new a_field_host();
    let props: NumberSlotProps;

    beforeEach(async () => {
        host.mount();
        await host.renderCase('number', { min: 1, max: 9, step: 2 });
        props = slotCalls['common.numberInput'].at(-1) as unknown as NumberSlotProps;
    });
    afterEach(() => host.unmount());

    it('should hand the number value to the slot', () => props.value.should.equal(5));
    it('should hand the bounds to the slot', () => [props.min, props.max, props.step].should.deep.equal([1, 9, 2]));
    it('should label the control', () => props['aria-label'].should.equal('Count'));
});

describe('when rendering an invalid number field with input parts under an adapter', () => {
    const host = new a_field_host();
    let props: NumberSlotProps;

    beforeEach(async () => {
        host.mount();
        await host.renderCase('number with parts');
        props = slotCalls['common.numberInput'].at(-1) as unknown as NumberSlotProps;
    });
    afterEach(() => host.unmount());

    it('should hand the input part to the slot as its root part', () =>
        props.pt.root.className.should.equal('i'));
    it('should hand the disabled and read-only state through the part', () =>
        [props.pt.root.disabled, props.pt.root.readOnly].should.deep.equal([true, true]));
    it('should flag the slot invalid', () => props.invalid.should.equal(true));
    it('should use the part id', () => props.id.should.equal('num-id'));
    it('should describe the control with the hint and the error', () =>
        props['aria-describedby'].should.equal('hint num-id-errors'));
    it('should not hand the field class to the slot', () => (props.className === undefined).should.equal(true));
});
