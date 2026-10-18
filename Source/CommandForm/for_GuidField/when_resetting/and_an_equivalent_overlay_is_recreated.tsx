// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form, sampleGuid } from '../given/a_guid_form';

describe('when an equivalent Guid overlay is recreated during a draft', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
        await form.edit('partial');
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
    });

    it('should keep the draft', () => form.input.value.should.equal('partial'));
    it('should keep the format error', () => form.context.customFieldErrors.sampleId.should.equal('Enter a valid Guid.'));
}));
