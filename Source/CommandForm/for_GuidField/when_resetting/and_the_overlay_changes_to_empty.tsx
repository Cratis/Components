// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form, sampleGuid } from '../given/a_guid_form';

// The invalid draft already emptied the command value, so only the overlay change carries the reset.
describe('when resetting a draft and the overlay changes to empty', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
        await form.edit('partial');
        await form.render({ currentValues: { sampleId: undefined } });
        await form.submit();
    });

    it('should clear the draft', () => form.input.value.should.equal(''));
    it('should clear the format error', () => (form.context.customFieldErrors.sampleId === undefined).should.be.true);
    it('should submit without an identifier', () => form.submittedBody.should.deep.equal({ name: 'Sample User' }));
}));
