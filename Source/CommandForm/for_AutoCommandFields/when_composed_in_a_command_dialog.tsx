// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../given';
import { an_auto_fields_host } from './given/an_auto_fields_host';

describe('when composed in a command dialog', given(an_auto_fields_host, host => {
    beforeEach(async () => {
        await host.render('dialog');
        await host.edit('Name', 'Edited User');
        await host.submit('dialog');
    });

    it('should render each field once', () => document.querySelectorAll('input[aria-label="Name"]').length.should.equal(1));
    it('should submit the edited value', () => (host.submitted[0] as { name: string }).name.should.equal('Edited User'));
    it('should execute once', () => host.submitted.length.should.equal(1));
}));
