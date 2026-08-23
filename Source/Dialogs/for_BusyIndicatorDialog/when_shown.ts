// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React from 'react';
import { BusyIndicatorDialog } from '../BusyIndicatorDialog';
import {
    focusIsInsideTheDialog,
    focusedElement,
    render,
    unmount,
    type DialogInTheDom,
} from '../for_Dialog/given/a_dialog_in_the_dom';

/**
 * A busy indicator has no buttons at all, so there is nothing for the browser
 * to focus and focus used to stay on `document.body` — outside the modal it is
 * blocked by, which leaves a keyboard or screen-reader user with nothing.
 */
describe('when a busy indicator dialog is shown', () => {
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        dialog = await render(
            React.createElement(BusyIndicatorDialog, {
                title: 'Saving',
                message: 'Persisting your changes',
            }),
        );
    });

    afterEach(async () => await unmount(dialog));

    it('should move focus into the dialog', () => {
        focusIsInsideTheDialog().should.be.true;
    });

    it('should focus the title so the wait state is announced', () => {
        focusedElement().should.equal('h2:Saving');
    });
});
