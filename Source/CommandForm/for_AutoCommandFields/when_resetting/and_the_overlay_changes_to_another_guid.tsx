// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { an_auto_fields_host } from '.././given/an_auto_fields_host';
const sampleGuid = '852afc19-b630-43ba-a612-93e1c522078d';
const otherGuid = '715ad639-c834-4032-b193-42eb599b73d7';

describe('when resetting a draft and the overlay changes to another guid', given(an_auto_fields_host, host => {
    beforeEach(async () => {
        await host.render('form', { registerGuid: true, hostCurrentValues: { sampleId: Guid.parse(sampleGuid) }, fields: { currentValues: { sampleId: Guid.parse(sampleGuid) } } });
        await host.edit('Sample Id', 'partial');
        await host.rerender('form', { hostCurrentValues: { sampleId: Guid.parse(otherGuid) }, fields: { currentValues: { sampleId: Guid.parse(otherGuid) } } });
    });

    it('should display the new identifier', () => host.input('Sample Id').value.should.equal(otherGuid));
    it('should submit the new identifier', async () => {
        await host.submit('form');
        (host.submitted[0] as { sampleId: string }).sampleId.should.equal(otherGuid);
    });
}));
