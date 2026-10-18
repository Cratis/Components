// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../../given';
import { GuidField, type GuidFieldProps } from '../../fields/GuidField';
import { a_guid_form, SampleRequiredGuidCommand } from '../given/a_guid_form';

describe('when customizing the error messages', given(a_guid_form, form => {
    function LocalizedGuidField(props: GuidFieldProps) {
        return <GuidField {...props} formatErrorMessage='Example format message' requiredErrorMessage='Example required message' />;
    }
    let requiredError: string | undefined;

    beforeEach(async () => {
        form.registerGuidProvider(LocalizedGuidField);
        await form.render({ command: SampleRequiredGuidCommand });
        requiredError = form.context.customFieldErrors.sampleId;
        await form.edit('partial');
    });

    it('should report the localized required error', () => requiredError!.should.equal('Example required message'));
    it('should report the localized format error', () => form.context.customFieldErrors.sampleId.should.equal('Example format message'));
    it('should describe the input with the localized error', () =>
        document.getElementById(form.input.getAttribute('aria-describedby')!)!.textContent!.should.equal('Example format message'));
}));
