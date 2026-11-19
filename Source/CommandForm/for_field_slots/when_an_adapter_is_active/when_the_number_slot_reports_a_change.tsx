// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import sinon from 'sinon';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import type {} from 'chai/register-should';

vi.mock('@cratis/arc.react/commands', () => ({
    asCommandFormField: (component: unknown) => component,
}));

import { a_field_host } from '../given/a_field_host';

[
    { entry: '7', expected: 7 },
    { entry: '-2.5', expected: -2.5 },
    { entry: '', expected: 0 },
    { entry: 'abc', expected: 0 },
].forEach(({ entry, expected }) => {
    describe(`when the number slot reports "${entry}" under an adapter`, () => {
        const host = new a_field_host();
        const onChange = sinon.spy();

        beforeEach(async () => {
            host.mount();
            await host.renderCase('number', { onChange, value: 1 });
            await host.type('5');
            await host.type(entry);
        });
        afterEach(() => host.unmount());

        it('should report the command number', () => (onChange.lastCall.args[0] as number).should.equal(expected));
    });
});
