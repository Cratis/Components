// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form, exampleGuid } from '../given/a_guid_form';

describe('when a caller owns the error and a valid edit excludes the field', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render({ onFieldValidate: () => 'Example validation message' }, true);
        await form.edit(exampleGuid);
    });

    it('should unmount the field', () => (form.input === null).should.be.true);
    it('should keep the caller error', () => form.context.customFieldErrors.sampleId.should.equal('Example validation message'));
}));
