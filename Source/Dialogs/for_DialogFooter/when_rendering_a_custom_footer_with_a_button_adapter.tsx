// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { DialogResult } from '@cratis/arc.react/dialogs';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { mountFooter, unmountFooter, type FooterWithAnAdapter } from './given/a_footer_with_a_button_adapter';

describe('when rendering a custom footer with a button adapter', () => {
    let footer: FooterWithAnAdapter;
    let results: DialogResult[];

    beforeEach(async () => {
        results = [];
        footer = await mountFooter({ onResult: (result) => results.push(result), buttons: <span data-custom='true'>Custom</span> });

    });

    afterEach(async () => {
        await unmountFooter(footer);
    });

    it('should not render the common button slot', () => {
        footer.received.length.should.equal(0);
    });

    it('should render the custom footer', () => {
        (footer.container.querySelector('[data-custom]') !== null).should.equal(true);
    });
});
