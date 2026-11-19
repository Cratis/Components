// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { an_auto_fields_host } from '.././given/an_auto_fields_host';
const sampleGuid = '852afc19-b630-43ba-a612-93e1c522078d';

describe('when resetting a draft and the overlay changes to empty', given(an_auto_fields_host, host => {
    beforeEach(async () => {
        await host.render('form', { registerGuid: true, fields: { currentValues: { sampleId: Guid.parse(sampleGuid) } } });
        await host.edit('Sample Id', 'partial');
        await host.rerender('form', { fields: { currentValues: { sampleId: undefined } } });
        await host.submit('form');
    });

    it('should clear the draft', () => host.input('Sample Id').value.should.equal(''));
    it('should submit without an identifier', () => (host.submitted[0] as { sampleId?: string }).should.not.have.property('sampleId'));
    it('should execute once', () => host.submitted.length.should.equal(1));
}));
