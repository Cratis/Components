// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import React from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dialog } from '../Dialog';
import { render, unmount, type DialogInTheDom } from './given/a_dialog_in_the_dom';

/**
 * A second dialog opened while the first is still visible is not a React child of the first -
 * it is typically triggered from a click handler and rendered by whatever ancestor holds both,
 * exactly as this spec mounts them: two independent, simultaneously visible dialogs. Nothing
 * about their stacking should depend on being nested in the React tree.
 */
describe('when a dialog is opened from another dialog that is still open', () => {
    let first: DialogInTheDom;
    let firstZIndex: number;
    let secondZIndex: number;

    beforeEach(async () => {
        first = await render(
            React.createElement(
                React.Fragment,
                null,
                React.createElement(Dialog, {
                    title: 'First dialog',
                    visible: true,
                    buttons: null,
                }),
                React.createElement(Dialog, {
                    title: 'Second dialog',
                    visible: true,
                    buttons: null,
                }),
            ),
        );

        const backdrops = document.querySelectorAll(
            '.cratis-dialog__backdrop[data-cratis-part="backdrop"]',
        );
        const [firstBackdrop, secondBackdrop] = Array.from(backdrops) as HTMLElement[];
        firstZIndex = Number.parseInt(firstBackdrop.style.zIndex, 10);
        secondZIndex = Number.parseInt(secondBackdrop.style.zIndex, 10);
    });

    afterEach(async () => {
        await unmount(first);
    });

    it('should give each dialog a distinct z-index', () => {
        expect(firstZIndex).to.not.equal(secondZIndex);
    });

    it('should stack the dialog opened later above the one that was already open', () => {
        expect(secondZIndex).to.be.greaterThan(firstZIndex);
    });
});
