// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { DialogResult } from '@cratis/arc.react/dialogs';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { mountFooter, unmountFooter, type FooterWithAnAdapter } from './given/a_footer_with_a_button_adapter';

describe('when rendering part attributes with a button adapter', () => {
    let footer: FooterWithAnAdapter;
    let results: DialogResult[];

    beforeEach(async () => {
        results = [];
        footer = await mountFooter({ onResult: (result) => results.push(result), pt: { confirm: { title: 'confirm-title' }, cancel: { title: 'cancel-title' } } });

    });

    afterEach(async () => {
        await unmountFooter(footer);
    });

    it('should hand the confirm attributes to the adapter as the root part', () => {
        footer.received[0].pt!.root!.title!.should.equal('confirm-title');
    });

    it('should hand the cancel attributes to the adapter as the root part', () => {
        footer.received[1].pt!.root!.title!.should.equal('cancel-title');
    });
});
