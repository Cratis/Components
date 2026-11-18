// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { DialogButtons, DialogResult } from '@cratis/arc.react/dialogs';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { adapterButtons, mountFooter, unmountFooter, type FooterWithAnAdapter } from './given/a_footer_with_a_button_adapter';

describe('when rendering the footer with a button adapter', () => {
    let footer: FooterWithAnAdapter;
    let results: DialogResult[];

    beforeEach(async () => {
        results = [];
        footer = await mountFooter({ onResult: (result) => results.push(result), buttons: DialogButtons.OkCancel });

    });

    afterEach(async () => {
        await unmountFooter(footer);
    });

    it('should render every standard button through the adapter', () => {
        adapterButtons(footer).map((button) => button.textContent).should.deep.equal(['Ok', 'Cancel']);
    });

    it('should hand the adapter a native button type', () => {
        footer.received.every((props) => props.type === 'button').should.equal(true);
    });

    it('should encode the confirming button as the solid variant', () => {
        footer.received.map((props) => props.variant).should.deep.equal(['solid', 'outline']);
    });

    it('should not disable an idle button', () => {
        adapterButtons(footer).every((button) => !button.disabled).should.equal(true);
    });

    it('should hand initial focus to the confirm button', () => {
        footer.props.confirmRef.current!.textContent!.should.equal('Ok');
    });
});
