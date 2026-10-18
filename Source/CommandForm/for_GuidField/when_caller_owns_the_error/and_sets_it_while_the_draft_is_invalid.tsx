// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form, exampleGuid } from '../given/a_guid_form';

describe('when a caller sets the field error while the draft is invalid', given(a_guid_form, form => {
    let whileInvalid: string | undefined;

    beforeEach(async () => {
        await form.render();
        await form.edit('partial');
        await act(async () => form.context.setCustomFieldError('sampleId', 'Example caller message'));
        await form.render({});
        whileInvalid = form.context.customFieldErrors.sampleId;
        await form.edit(exampleGuid);
        await form.render({});
    });

    it('should keep the caller error across rerenders of the invalid draft', () => whileInvalid!.should.equal('Example caller message'));
    it('should keep the caller error after the draft becomes valid', () => form.context.customFieldErrors.sampleId.should.equal('Example caller message'));
    it('should keep the form invalid', () => form.context.isValid.should.be.false);
}));
