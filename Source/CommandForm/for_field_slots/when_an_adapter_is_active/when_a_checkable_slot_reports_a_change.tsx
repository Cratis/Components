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

['checkbox', 'switch'].forEach((name) => {
    describe(`when the ${name} slot reports a change`, () => {
        const host = new a_field_host();
        const onChange = sinon.spy();

        beforeEach(async () => {
            host.mount();
            await host.renderCase(name, { onChange, value: false });
            await host.click();
        });
        afterEach(() => host.unmount());

        it('should report the semantic boolean value', () => (onChange.lastCall.args[0] as boolean).should.equal(true));
    });
});
