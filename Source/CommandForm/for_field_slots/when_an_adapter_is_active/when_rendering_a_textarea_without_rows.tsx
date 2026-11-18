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

describe('when rendering a textarea without rows under an adapter', () => {
    const host = new a_field_host();

    beforeEach(async () => {
        host.mount();
        await host.renderCase('textarea defaults');
    });
    afterEach(() => host.unmount());

    it('should pass the default row count to the slot', () => (slotCalls['common.textArea'].at(-1)!.rows as number).should.equal(5));
});
