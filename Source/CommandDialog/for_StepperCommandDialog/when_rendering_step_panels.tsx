// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { mount, validation } from './given/a_navigable_dialog_in_the_dom';
import { unmount, type StepperDialogInTheDom } from './given/a_stepper_dialog_in_the_dom';

let dialog: StepperDialogInTheDom;

afterEach(async () => await unmount(dialog));

describe('when rendering dialog step panels', () => {
    beforeEach(async () => {
        validation.invalid = false;
        dialog = await mount();
    });

    it('should label every panel with its own header', () => {
        const panels = dialog.container.querySelectorAll<HTMLElement>('[data-cratis-part="panel"]');
        const headers = dialog.container.querySelectorAll<HTMLElement>('[data-cratis-part="header"]');
        headers.length.should.equal(panels.length);
        for (let index = 0; index < panels.length; index++) {
            headers[index].id.should.not.equal('');
            (panels[index].getAttribute('aria-labelledby') ?? '').should.equal(headers[index].id);
        }
        headers[0].id.should.not.equal(headers[1].id);
    });
});
