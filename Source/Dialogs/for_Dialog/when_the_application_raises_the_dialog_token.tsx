// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import React from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dialog } from '../Dialog';
import { render, unmount, type DialogInTheDom } from './given/a_dialog_in_the_dom';
import { resolveZIndex } from '../../renderer/for_dialog_stack/resolveZIndex';

/**
 * An application is expected to retune `--cratis-z-index-dialog` to fit its own stacking order.
 * Cratis Studio raises it to 10100 so that dialogs opened from inside a full-screen overlay - its
 * organization settings pages, among others - clear that overlay's own 9999 layer.
 *
 * Assigning a dialog a tier must not cost it that override. A tier resolved to a bare number put
 * every dialog back in the default 1100 band no matter what the application had asked for, which
 * left dialogs opened from those settings pages rendering behind the overlay that opened them -
 * present in the DOM, correct in every other respect, and completely invisible.
 */
describe('when the application raises the dialog z-index token', () => {
    const raisedToken = 10100;
    const appChromeZIndex = 9999;
    let dialog: DialogInTheDom;
    let backdropZIndex: number;
    let secondBackdropZIndex: number;

    beforeEach(async () => {
        document.documentElement.style.setProperty('--cratis-z-index-dialog', `${raisedToken}`);
        dialog = await render(
            React.createElement(
                React.Fragment,
                null,
                React.createElement(Dialog, {
                    title: 'Opened from the overlay',
                    visible: true,
                    buttons: null,
                }),
                React.createElement(Dialog, {
                    title: 'Opened from the first dialog',
                    visible: true,
                    buttons: null,
                }),
            ),
        );

        const backdrops = Array.from(
            document.querySelectorAll('.cratis-dialog__backdrop[data-cratis-part="backdrop"]'),
        ) as HTMLElement[];
        backdropZIndex = resolveZIndex(backdrops[0]);
        secondBackdropZIndex = resolveZIndex(backdrops[1]);
    });

    afterEach(async () => {
        document.documentElement.style.removeProperty('--cratis-z-index-dialog');
        await unmount(dialog);
    });

    it('should place the first dialog at the raised token rather than the default band', () => {
        expect(backdropZIndex).to.equal(raisedToken);
    });

    it('should keep the first dialog above the application chrome it was opened from', () => {
        expect(backdropZIndex).to.be.greaterThan(appChromeZIndex);
    });

    it('should keep a dialog opened from that dialog above the chrome as well', () => {
        expect(secondBackdropZIndex).to.be.greaterThan(appChromeZIndex);
    });

    it('should still stack the later dialog above the earlier one', () => {
        expect(secondBackdropZIndex).to.be.greaterThan(backdropZIndex);
    });
});
