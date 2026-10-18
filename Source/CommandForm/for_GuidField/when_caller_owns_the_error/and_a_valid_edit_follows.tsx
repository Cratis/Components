// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form, exampleGuid } from '../given/a_guid_form';

describe('when a caller owns the error and a valid edit follows', given(a_guid_form, form => {
    const onFieldValidate = () => 'Example validation message';
    let afterEdit: string | undefined;

    beforeEach(async () => {
        await form.render({ onFieldValidate });
        await form.edit('partial');
        await form.edit(exampleGuid);
        afterEdit = form.context.customFieldErrors.sampleId;
        await form.render({ onFieldValidate, exclude: ['sampleId'] });
    });

    it('should keep the caller error after the valid edit', () => afterEdit!.should.equal('Example validation message'));
    it('should keep the caller error after the field unmounts', () => form.context.customFieldErrors.sampleId.should.equal('Example validation message'));
}));
