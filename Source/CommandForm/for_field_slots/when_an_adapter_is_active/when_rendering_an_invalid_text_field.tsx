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

describe('when rendering an invalid text field under an adapter', () => {
    const host = new a_field_host();
    let props: Record<string, unknown>;

    beforeEach(async () => {
        host.mount();
        await host.renderCase('invalid text', { id: 'name-input', 'aria-describedby': 'hint' });
        props = slotCalls['common.textInput'].at(-1)!;
    });
    afterEach(() => host.unmount());

    it('should pass the identity', () => (props.id as string).should.equal('name-input'));
    it('should pass the accessible name', () => (props['aria-label'] as string).should.equal('Name'));
    it('should pass the description including the error', () => (props['aria-describedby'] as string).should.equal('hint name-input-errors'));
    it('should pass the invalid state', () => (props.invalid as boolean).should.equal(true));
    it('should pass aria-invalid', () => (props['aria-invalid'] as boolean).should.equal(true));
    it('should keep the error text owned by the field', () =>
        host.container.querySelector('#name-input-errors')!.textContent!.should.equal('Bad value. Worse'));
});
