// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { render, renderNavigation, unmount, validation, type InlineStepperInTheDom } from './given/an_inline_stepper_in_the_dom';

let stepper: InlineStepperInTheDom;

afterEach(async () => await unmount(stepper));

describe('when rendering step panels with generated header ids', () => {
    beforeEach(async () => {
        validation.invalid = false;
        stepper = await renderNavigation();
    });

    it('should label every panel with its own header', () => {
        const panels = stepper.container.querySelectorAll<HTMLElement>('[data-cratis-part="panel"]');
        const headers = stepper.container.querySelectorAll<HTMLElement>('[data-cratis-part="header"]');
        headers.length.should.equal(panels.length);
        for (let index = 0; index < panels.length; index++) {
            headers[index].id.should.not.equal('');
            (panels[index].getAttribute('aria-labelledby') ?? '').should.equal(headers[index].id);
        }
        headers[0].id.should.not.equal(headers[1].id);
    });
});

describe('when rendering step panels with a custom panel label reference', () => {
    beforeEach(async () => {
        stepper = await render({ pt: { panel: { 'aria-labelledby': 'custom-label' } } });
    });

    it('should keep the caller supplied label reference', () => {
        const panel = stepper.container.querySelector<HTMLElement>('[data-cratis-part="panel"]');
        (panel?.getAttribute('aria-labelledby') ?? '').should.equal('custom-label');
    });
});
