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

describe('when the text slot loses focus', () => {
    const host = new a_field_host();
    const onBlur = sinon.spy();

    beforeEach(async () => {
        host.mount();
        await host.renderCase('text', { onBlur });
        await host.blur();
    });
    afterEach(() => host.unmount());

    it('should forward blur to the field', () => onBlur.called.should.equal(true));
});
