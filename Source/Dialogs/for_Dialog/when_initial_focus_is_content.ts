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
    titleTabIndex,
    unmount,
    type DialogInTheDom,
} from './given/a_dialog_in_the_dom';

describe('when initial focus is content', () => {
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
                initialFocus: DialogInitialFocus.Content,
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

    it('should focus the title rather than any button', async () => {
        await renderDialog(DialogButtons.OkCancel);

        focusedElement().should.equal('h2:Delete personal data');
    });

    it('should make the title focusable without putting it in the tab order', async () => {
        await renderDialog(DialogButtons.OkCancel);

        titleTabIndex().should.equal('-1');
    });

    it('should move focus into a dialog that has no focusable content at all', async () => {
        await renderDialog(null);

        focusedElement().should.equal('h2:Delete personal data');
        focusIsInsideTheDialog().should.be.true;
    });

    it('should arm nothing, so an Enter that repeats onto the dialog does nothing', async () => {
        await renderDialog(DialogButtons.OkCancel);

        await pressEnterOnFocusedElement();

        confirmed.should.equal(0);
        cancelled.should.equal(0);
    });
});
