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
import { slotCalls } from '../given/a_stub_adapter';

describe('when a radio option is selected under an adapter', () => {
    const host = new a_field_host();
    const onChange = sinon.spy();

    beforeEach(async () => {
        host.mount();
        await host.renderCase('radio group', { onChange, value: 'one' });
        await host.click(1);
    });
    afterEach(() => host.unmount());

    it('should render one slot per option', () => host.stubs('radio').length.should.equal(2));
    it('should mark only the bound option as checked', () =>
        slotCalls['common.radio'].slice(0, 2).map((props) => props.checked).should.deep.equal([true, false]));
    it('should report the option value', () => (onChange.lastCall.args[0] as string).should.equal('two'));
});
