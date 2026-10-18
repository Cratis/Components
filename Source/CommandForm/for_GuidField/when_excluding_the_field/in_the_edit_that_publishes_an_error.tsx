// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form, sampleGuid } from '../given/a_guid_form';

describe('when the edit that publishes a format error also excludes the field', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } }, true);
        await form.edit('partial');
        await form.submit();
    });

    it('should unmount the field', () => (form.input === null).should.be.true);
    it('should leave the command value empty', () => (form.context.commandInstance.sampleId === undefined).should.be.true);
    it('should remove its own format error', () => (form.context.customFieldErrors.sampleId === undefined).should.be.true);
    it('should submit without an identifier', () => form.submittedBody.should.deep.equal({ name: 'Sample User' }));
}));
