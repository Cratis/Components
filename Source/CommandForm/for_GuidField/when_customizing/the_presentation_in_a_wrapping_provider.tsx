// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../../given';
import { GuidField, type GuidFieldProps } from '../../fields/GuidField';
import { a_guid_form, exampleGuid } from '../given/a_guid_form';

// The wrapper is not a marked field, so GuidField binds itself behind it.
describe('when a wrapping provider customizes the presentation', given(a_guid_form, form => {
    function ExampleGuidField(props: GuidFieldProps) {
        return <GuidField {...props} placeholder='Example identifier' pt={{ root: { 'aria-label': 'Sample Id', className: 'example-guid' } }} />;
    }

    beforeEach(async () => {
        form.registerGuidProvider(ExampleGuidField);
        await form.render();
        await form.edit('partial');
        await form.submit();
        await form.edit(exampleGuid);
        await form.submit();
    });

    it('should apply the placeholder', () => form.input.placeholder.should.equal('Example identifier'));
    it('should apply the part class', () => form.input.classList.contains('example-guid').should.be.true);
    it('should veto the invalid draft', () => form.http.callCount.should.equal(1));
    it('should submit the native value', () => form.submittedBody.sampleId.should.equal(exampleGuid));
}));
