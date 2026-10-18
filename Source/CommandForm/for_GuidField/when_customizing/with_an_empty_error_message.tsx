// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../../given';
import { GuidField, type GuidFieldProps } from '../../fields/GuidField';
import { a_guid_form } from '../given/a_guid_form';

describe('when customizing the format error with an empty message', given(a_guid_form, form => {
    function ExampleGuidField(props: GuidFieldProps) { return <GuidField {...props} formatErrorMessage='' />; }

    beforeEach(async () => {
        form.registerGuidProvider(ExampleGuidField);
        await form.render();
        await form.edit('partial');
    });

    it('should keep format validation with the default message', () => form.context.customFieldErrors.sampleId.should.equal('Enter a valid Guid.'));
}));
