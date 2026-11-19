// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../given';
import { an_auto_fields_host } from './given/an_auto_fields_host';

describe('when excluding properties', given(an_auto_fields_host, host => {
    beforeEach(async () => {
        await host.render('form', { fields: { exclude: ['name'] } });
        await host.submit('form');
    });

    it('should not render the excluded field', () => host.labels.should.deep.equal(['Age']));
    it('should keep the host value', () => (host.submitted[0] as { name: string }).name.should.equal('Sample User'));
}));
