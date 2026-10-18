// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form, exampleGuid, sampleGuid } from '../given/a_guid_form';

describe('when resetting a draft and the overlay changes to another Guid', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
        await form.edit('partial');
        await form.render({ currentValues: { sampleId: Guid.parse(exampleGuid) } });
        await form.submit();
    });

    it('should show the new identifier', () => form.input.value.should.equal(exampleGuid));
    it('should clear the format error', () => (form.context.customFieldErrors.sampleId === undefined).should.be.true);
    it('should submit the new identifier', () => form.submittedBody.sampleId.should.equal(exampleGuid));
}));
