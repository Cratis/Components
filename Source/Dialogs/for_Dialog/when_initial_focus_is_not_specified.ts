// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React from 'react';
import { DialogButtons } from '@cratis/arc.react/dialogs';
import { Dialog } from '../Dialog';
import { focusedElement, pressEnterOnFocusedElement, render, titleTabIndex, unmount, type DialogInTheDom } from './given/a_dialog_in_the_dom';

/**
 * The regression guard for the whole `initialFocus` feature: a dialog that does
 * not ask for anything must behave exactly as it did before the prop existed —
 * confirm button focused, and armed.
 */
describe('when initial focus is not specified', () => {
    let dialog: DialogInTheDom;
    let confirmed: number;
    let cancelled: number;

    const renderDialog = async (buttons: DialogButtons) => {
        confirmed = 0;
        cancelled = 0;
        dialog = await render(React.createElement(Dialog, {
            title: 'Delete personal data',
            visible: true,
            buttons,
            onConfirm: () => { confirmed++; return true; },
            onCancel: () => { cancelled++; return true; },
            children: React.createElement('p', null, 'This cannot be undone')
        }));
    };

    afterEach(async () => await unmount(dialog));

    it('should focus the Ok button of an Ok/Cancel dialog', async () => {
        await renderDialog(DialogButtons.OkCancel);

        focusedElement().should.equal('button:Ok');
    });

    it('should focus the Ok button of an Ok-only dialog', async () => {
        await renderDialog(DialogButtons.Ok);

        focusedElement().should.equal('button:Ok');
    });

    it('should focus the Yes button of a Yes/No dialog', async () => {
        await renderDialog(DialogButtons.YesNo);

        focusedElement().should.equal('button:Yes');
    });

    it('should focus the Yes button of a Yes/No/Cancel dialog', async () => {
        await renderDialog(DialogButtons.YesNoCancel);

        focusedElement().should.equal('button:Yes');
    });

    it('should leave the title unfocusable', async () => {
        await renderDialog(DialogButtons.OkCancel);

        titleTabIndex().should.equal('none');
    });

    it('should confirm on an Enter that repeats onto the freshly mounted dialog', async () => {
        await renderDialog(DialogButtons.OkCancel);

        await pressEnterOnFocusedElement();

        confirmed.should.equal(1);
        cancelled.should.equal(0);
    });
});
