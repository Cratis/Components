// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import type {} from 'chai/register-should';

vi.mock('@cratis/arc.react/commands', () => ({
    asCommandFormField: (component: unknown) => component,
}));

import { fieldCases } from '../given/field_cases';
import { a_field_host } from '../given/a_field_host';
import { slotCalls } from '../given/a_stub_adapter';
import { slotIdFor } from '../given/slot_ids';

fieldCases.forEach((fieldCase) => {
    describe(`when rendering the ${fieldCase.name} field under an adapter`, () => {
        const host = new a_field_host();

        beforeEach(async () => {
            host.mount();
            await host.renderCase(fieldCase.name);
        });
        afterEach(() => host.unmount());

        it('should render the adapter control', () => host.stubs().length.should.be.greaterThan(0));
        it('should resolve the field slot', () => slotCalls[slotIdFor(fieldCase.name)].length.should.be.greaterThan(0));
        it('should render no built-in field markup', () =>
            (host.container.querySelector('.cratis-field-input, [class*="cratis-choice"], [class*="cratis-radio__"]') === null).should.equal(true));
    });
});
