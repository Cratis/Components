// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dialog } from '../Dialog';
import { type DialogInTheDom, render, unmount } from './given/a_dialog_in_the_dom';

describe('when placing the dialog in the center', () => {
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        dialog = await render(<Dialog title='Account details'>Content</Dialog>);
    });

    afterEach(async () => {
        await unmount(dialog);
    });

    it('should be the default placement', () => {
        expect(
            document
                .querySelector('[data-cratis-part="root"]')
                ?.getAttribute('data-placement'),
        ).to.equal('center');
    });

    it('should not render a subtitle part', () => {
        expect(document.querySelector('[data-cratis-part="subtitle"]')).to.equal(null);
    });

    it('should not describe the dialog by a subtitle', () => {
        expect(
            document.querySelector('[role="dialog"]')?.hasAttribute('aria-describedby'),
        ).to.equal(false);
    });

    it('should render the default close glyph', () => {
        expect(
            document.querySelector('[data-cratis-part="close"]')?.textContent,
        ).to.equal('×');
    });
});
