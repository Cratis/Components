// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React from 'react';
import { DialogButtons } from '@cratis/arc.react/dialogs';
import { Dialog } from '../Dialog';
import { DialogInitialFocus } from '../DialogInitialFocus';
import {
    focusIsInsideTheDialog,
    focusedElement,
    pressEnterOnFocusedElement,
    render,
    unmount,
    type DialogInTheDom,
} from './given/a_dialog_in_the_dom';

describe('when initial focus is cancel', () => {
    let dialog: DialogInTheDom;
    let confirmed: number;
    let cancelled: number;

    const renderDialog = async (buttons: DialogButtons | React.ReactNode) => {
        confirmed = 0;
        cancelled = 0;
        dialog = await render(
            React.createElement(Dialog, {
                title: 'Delete personal data',
                visible: true,
                buttons,
                initialFocus: DialogInitialFocus.Cancel,
                onConfirm: () => {
                    confirmed++;
                    return true;
                },
                onCancel: () => {
                    cancelled++;
                    return true;
                },
                children: React.createElement('p', null, 'This cannot be undone'),
            }),
        );
    };

    afterEach(async () => await unmount(dialog));

    it('should focus the Cancel button of an Ok/Cancel dialog', async () => {
        await renderDialog(DialogButtons.OkCancel);

        focusedElement().should.equal('button:Cancel');
    });

    it('should focus the No button of a Yes/No dialog', async () => {
        await renderDialog(DialogButtons.YesNo);

        focusedElement().should.equal('button:No');
    });

    it('should focus the Cancel button of a Yes/No/Cancel dialog', async () => {
        await renderDialog(DialogButtons.YesNoCancel);

        focusedElement().should.equal('button:Cancel');
    });

    it('should fall back to the title when the button set has nothing to dismiss with', async () => {
        await renderDialog(DialogButtons.Ok);

        focusedElement().should.equal('h2:Delete personal data');
    });

    it('should fall back to the title when the footer is a custom node', async () => {
        await renderDialog(React.createElement('button', { type: 'button' }, 'Delete'));

        focusedElement().should.equal('h2:Delete personal data');
    });

    it('should keep focus inside the dialog rather than on the document body', async () => {
        await renderDialog(DialogButtons.Ok);

        focusIsInsideTheDialog().should.be.true;
    });

    it('should dismiss rather than confirm on an Enter that repeats onto the freshly mounted dialog', async () => {
        await renderDialog(DialogButtons.OkCancel);

        await pressEnterOnFocusedElement();

        confirmed.should.equal(0);
        cancelled.should.equal(1);
    });
});
