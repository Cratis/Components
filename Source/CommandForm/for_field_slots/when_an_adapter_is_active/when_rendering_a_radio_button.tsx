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

describe('when rendering a radio button under an adapter', () => {
    const host = new a_field_host();
    let props: Record<string, unknown>;

    beforeEach(async () => {
        host.mount();
        await host.renderCase('radio button');
        props = slotCalls['common.radio'].at(-1)!;
    });
    afterEach(() => host.unmount());

    it('should pass the group name', () => (props.name as string).should.equal('grp'));
    it('should pass the button value', () => (props.value as string).should.equal('a'));
    it('should pass the checked state', () => (props.checked as boolean).should.equal(true));
});
