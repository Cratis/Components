// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dialog } from '../Dialog';
import { type DialogInTheDom, render, unmount } from './given/a_dialog_in_the_dom';

describe('when composing the header', () => {
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        dialog = await render(
            <Dialog
                title='Internal note'
                subtitle='FRP-1284 · Equinor ASA'
                closeIcon={<svg data-glyph='x' aria-hidden='true' />}
                closeAriaLabel='Close note'
                pt={{ subtitle: { 'data-product-line': 'reference' } }}
            >
                Content
            </Dialog>,
        );
    });

    afterEach(async () => {
        await unmount(dialog);
    });

    it('should render the subtitle as a stable part under the heading', () => {
        const header = document.querySelector('[data-cratis-part="header"]');
        const parts = Array.from(header?.children ?? []).map((child) =>
            child.getAttribute('data-cratis-part'),
        );
        expect(parts).to.deep.equal(['title', 'subtitle', 'close']);
        expect(
            document.querySelector('[data-cratis-part="subtitle"]')?.textContent,
        ).to.equal('FRP-1284 · Equinor ASA');
    });

    it('should apply pass-through attributes to the subtitle', () => {
        expect(
            document
                .querySelector('[data-cratis-part="subtitle"]')
                ?.getAttribute('data-product-line'),
        ).to.equal('reference');
    });

    it('should describe the dialog by its subtitle', () => {
        const modal = document.querySelector('[role="dialog"]');
        const subtitle = document.querySelector('[data-cratis-part="subtitle"]');
        expect(modal?.getAttribute('aria-describedby')).to.equal(subtitle?.id);
        expect(subtitle?.id).to.not.equal('');
    });

    it('should render the supplied close glyph with the accessible label', () => {
        const close = document.querySelector('[data-cratis-part="close"]');
        expect(close?.querySelector('[data-glyph="x"]')).to.not.equal(null);
        expect(close?.getAttribute('aria-label')).to.equal('Close note');
    });
});
