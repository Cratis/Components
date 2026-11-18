// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { DialogResult } from '@cratis/arc.react/dialogs';
import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { adapterButtons, mountFooter, unmountFooter, type FooterWithAnAdapter } from './given/a_footer_with_a_button_adapter';

describe('when rendering a busy footer with a button adapter', () => {
    let footer: FooterWithAnAdapter;
    let results: DialogResult[];

    beforeEach(async () => {
        results = [];
        footer = await mountFooter({ onResult: (result) => results.push(result), isBusy: true });
        await act(async () => {
            adapterButtons(footer).forEach((button) => button.click());
        });
    });

    afterEach(async () => {
        await unmountFooter(footer);
    });

    it('should keep the confirm button focusable', () => {
        adapterButtons(footer)[0].disabled.should.equal(false);
    });

    it('should mark the confirm button aria-disabled', () => {
        adapterButtons(footer)[0].getAttribute('aria-disabled')!.should.equal('true');
    });

    it('should mark the confirm button aria-busy', () => {
        adapterButtons(footer)[0].getAttribute('aria-busy')!.should.equal('true');
    });

    it('should hand the spinner to the adapter as the icon', () => {
        (adapterButtons(footer)[0].querySelector('.cratis-dialog__spinner') !== null).should.equal(true);
    });

    it('should disable the dismissing button', () => {
        adapterButtons(footer)[1].disabled.should.equal(true);
    });

    it('should not yield a result', () => {
        results.should.deep.equal([]);
    });
});
