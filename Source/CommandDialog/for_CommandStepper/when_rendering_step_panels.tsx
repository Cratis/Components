// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { render, unmount, type InlineStepperInTheDom } from './given/an_inline_stepper_in_the_dom';

let stepper: InlineStepperInTheDom;

afterEach(async () => await unmount(stepper));

describe('when rendering step panels with a custom panel label reference', () => {
    beforeEach(async () => {
        stepper = await render({ pt: { panel: { 'aria-labelledby': 'custom-label' } } });
    });

    it('should keep the caller supplied label reference', () => {
        const panel = stepper.container.querySelector<HTMLElement>('[data-cratis-part="panel"]');
        (panel?.getAttribute('aria-labelledby') ?? '').should.equal('custom-label');
    });
});
