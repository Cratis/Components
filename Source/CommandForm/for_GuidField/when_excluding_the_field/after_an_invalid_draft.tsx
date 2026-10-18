// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form } from '../given/a_guid_form';

describe('when excluding the field after an invalid draft', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render();
        await form.edit('partial');
        await form.render({ exclude: ['sampleId'] });
        await form.submit();
    });

    it('should unmount the field', () => (form.input === null).should.be.true);
    it('should remove its own format error', () => (form.context.customFieldErrors.sampleId === undefined).should.be.true);
    it('should submit', () => form.http.callCount.should.equal(1));
}));
