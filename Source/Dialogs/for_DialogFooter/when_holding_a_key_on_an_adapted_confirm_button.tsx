// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { adapterButtons, mountFooter, unmountFooter, type FooterWithAnAdapter } from './given/a_footer_with_a_button_adapter';

describe('when holding a key on an adapted confirm button', () => {
    let footer: FooterWithAnAdapter;
    let event: KeyboardEvent;

    beforeEach(async () => {
        footer = await mountFooter();
        event = new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true });
        await act(async () => {
            adapterButtons(footer)[0].dispatchEvent(event);
        });
    });

    afterEach(async () => {
        await unmountFooter(footer);
    });

    it('should suppress the repeated activation', () => {
        event.defaultPrevented.should.equal(true);
    });
});
