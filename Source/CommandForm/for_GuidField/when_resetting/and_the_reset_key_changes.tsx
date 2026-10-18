// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../../given';
import { GuidField, type GuidFieldProps } from '../../fields/GuidField';
import { a_guid_form } from '../given/a_guid_form';

describe('when resetting a draft by changing the reset key', given(a_guid_form, form => {
    let resetKey = 0;
    function ExampleGuidField(props: GuidFieldProps) { return <GuidField {...props} resetKey={resetKey} />; }

    beforeEach(async () => {
        form.registerGuidProvider(ExampleGuidField);
        await form.render();
        await form.edit('partial');
        resetKey++;
        await form.render();
    });

    it('should clear the draft', () => form.input.value.should.equal(''));
    it('should clear the format error', () => (form.context.customFieldErrors.sampleId === undefined).should.be.true);
}));
