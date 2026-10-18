// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form, sampleGuid } from '../given/a_guid_form';

describe('when GuidField is not registered and a custom provider handles Guids', given(a_guid_form, form => {
    const received: Record<string, unknown>[] = [];
    function ExampleGuidDisplay(props: Record<string, unknown>) {
        received.push(props);
        return <output>{String(props.title)}</output>;
    }

    beforeEach(async () => {
        received.length = 0;
        form.registerGuidProvider(ExampleGuidDisplay);
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
    });

    it('should render the custom provider', () => form.container.querySelector('output')!.textContent!.should.equal('Sample Id'));
    it('should not pass a reset key to the custom provider', () => received.some((props) => 'resetKey' in props).should.be.false);
}));
