// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../given';
import { a_guid_form, sampleGuid } from './given/a_guid_form';

describe('when an edited optional Guid is cleared', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render();
        await form.edit(sampleGuid);
        await form.edit('partial');
        await form.edit('');
        await form.submit();
    });

    it('should show empty text', () => form.input.value.should.equal(''));
    it('should leave the command value empty', () => (form.context.commandInstance.sampleId === undefined).should.be.true);
    it('should clear its format error', () => (form.context.customFieldErrors.sampleId === undefined).should.be.true);
    it('should submit without an identifier', () => form.submittedBody.should.deep.equal({ name: 'Sample User' }));
}));
