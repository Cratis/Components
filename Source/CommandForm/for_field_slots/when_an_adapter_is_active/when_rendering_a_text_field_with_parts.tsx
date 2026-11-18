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

describe('when rendering a text field with a class and parts under an adapter', () => {
    const host = new a_field_host();
    let props: Record<string, unknown>;

    beforeEach(async () => {
        host.mount();
        await host.renderCase('text with parts');
        props = slotCalls['common.textInput'].at(-1)!;
    });
    afterEach(() => host.unmount());

    it('should hand the consumer class to the slot unchanged', () => (props.className as string).should.equal('consumer'));
    it('should hand the root part to the slot unchanged', () =>
        (props.pt as { root: { className: string } }).root.className.should.equal('part'));
});
