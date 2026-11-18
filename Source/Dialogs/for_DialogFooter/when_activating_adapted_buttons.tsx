// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { DialogButtons, DialogResult } from '@cratis/arc.react/dialogs';
import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { adapterButtons, mountFooter, unmountFooter, type FooterWithAnAdapter } from './given/a_footer_with_a_button_adapter';

describe('when activating the adapted buttons', () => {
    let footer: FooterWithAnAdapter;
    let results: DialogResult[];

    beforeEach(async () => {
        results = [];
        footer = await mountFooter({ onResult: (result) => results.push(result), buttons: DialogButtons.YesNoCancel });
        await act(async () => {
            adapterButtons(footer).forEach((button) => button.click());
        });
    });

    afterEach(async () => {
        await unmountFooter(footer);
    });

    it('should yield each button result in display order', () => {
        results.should.deep.equal([DialogResult.Yes, DialogResult.No, DialogResult.Cancelled]);
    });
});
