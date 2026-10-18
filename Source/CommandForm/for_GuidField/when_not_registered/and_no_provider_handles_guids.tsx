// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { clearFieldTypeProviders } from '../../fieldTypeProviderRegistry';
import { registerDefaultFieldTypeProviders } from '../../defaultFieldTypeProviders';
import { a_guid_form, sampleGuid } from '../given/a_guid_form';

describe('when GuidField is not registered and no provider handles Guids', given(a_guid_form, form => {
    beforeEach(async () => {
        clearFieldTypeProviders();
        registerDefaultFieldTypeProviders();
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
        await form.submit();
    });

    it('should leave the Guid property out of the generated fields', () => (form.input === null).should.be.true);
    it('should render only the string field', () => form.container.querySelectorAll('input').length.should.equal(1));
    it('should not add a custom error', () => Object.keys(form.context.customFieldErrors).length.should.equal(0));
    it('should submit the existing command value', () => form.submittedBody.should.deep.equal({ sampleId: sampleGuid, name: 'Sample User' }));
}));
