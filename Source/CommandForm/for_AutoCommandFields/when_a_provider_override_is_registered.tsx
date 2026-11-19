// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import type {} from 'chai/register-should';
import { given } from '../../given';
import { an_auto_fields_host } from './given/an_auto_fields_host';
import { registerFieldTypeProvider } from '../fieldTypeProviderRegistry';
import { TextAreaField } from '../fields';

describe('when a provider override is registered for a type with a default', given(an_auto_fields_host, host => {
    const areas = () => host.container.querySelectorAll('textarea');

    beforeEach(async () => {
        registerFieldTypeProvider({ canHandle: (descriptor) => descriptor.type === String, component: TextAreaField });
        await host.render('form');
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(areas()[0], 'Edited User');
            areas()[0].dispatchEvent(new Event('input', { bubbles: true }));
        });
        await host.submit('form');
    });

    it('should replace the default field', () => host.container.querySelectorAll('input[aria-label="Name"]').length.should.equal(0));
    it('should render the override once', () => areas().length.should.equal(1));
    it('should keep the override bound to the command', () => (host.submitted[0] as { name: string }).name.should.equal('Edited User'));
}));
