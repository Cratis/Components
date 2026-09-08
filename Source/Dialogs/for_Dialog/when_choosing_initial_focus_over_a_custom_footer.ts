// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React from 'react';
import { DialogButtons } from '@cratis/arc.react/dialogs';
import { Dialog } from '../Dialog';
import { DialogInitialFocus } from '../DialogInitialFocus';
import { click, hasCloseButton, pressEscape, render, unmount, type DialogInTheDom } from './given/a_dialog_in_the_dom';

/**
 * Before `initialFocus` existed, the only way to stop the confirm button being
 * armed was to replace the footer with a custom node — which silently takes the
 * close (X), `Escape` and every confirm/cancel callback away with it, because
 * the dialog can no longer tell which of the caller's buttons means what.
 *
 * These specs pin both halves: what `initialFocus` keeps, and what the old
 * workaround costs.
 */
describe('when choosing initial focus over a custom footer', () => {
    let dialog: DialogInTheDom;
    let confirmed: number;
    let cancelled: number;

    const renderDialog = async (buttons: DialogButtons | React.ReactNode, initialFocus?: DialogInitialFocus) => {
        confirmed = 0;
        cancelled = 0;
        dialog = await render(React.createElement(Dialog, {
            title: 'Delete personal data',
            visible: true,
            buttons,
            initialFocus,
            onConfirm: () => { confirmed++; return true; },
            onCancel: () => { cancelled++; return true; },
            children: React.createElement('p', null, 'This cannot be undone')
        }));
    };

    const aCustomFooter = () => React.createElement('button', { type: 'button' }, 'Delete');

    afterEach(async () => await unmount(dialog));

    it('should keep the close button when initial focus is moved off the confirm button', async () => {
        await renderDialog(DialogButtons.OkCancel, DialogInitialFocus.Cancel);

        hasCloseButton().should.be.true;
    });

    it('should keep Escape closing the dialog when initial focus is moved off the confirm button', async () => {
        await renderDialog(DialogButtons.OkCancel, DialogInitialFocus.Cancel);

        await pressEscape();

        cancelled.should.equal(1);
    });

    it('should keep the confirm callback wired when initial focus is moved off the confirm button', async () => {
        await renderDialog(DialogButtons.OkCancel, DialogInitialFocus.Cancel);

        await click('Ok');

        confirmed.should.equal(1);
    });

    it('should lose the close button when the footer is replaced instead', async () => {
        await renderDialog(aCustomFooter());

        hasCloseButton().should.be.false;
    });

    it('should lose Escape when the footer is replaced instead', async () => {
        await renderDialog(aCustomFooter());

        await pressEscape();

        cancelled.should.equal(0);
    });

    it('should lose the confirm callback when the footer is replaced instead', async () => {
        await renderDialog(aCustomFooter());

        await click('Delete');

        confirmed.should.equal(0);
    });
});
