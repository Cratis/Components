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
        // Tiers resolve relative to this token rather than to a hardcoded number, so it has to be
        // defined for the stacking order to be measurable at all.
        document.documentElement.style.setProperty('--cratis-z-index-dialog', '1100');
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
        firstZIndex = resolveZIndex(firstBackdrop);
        secondZIndex = resolveZIndex(secondBackdrop);
    });

    afterEach(async () => {
        document.documentElement.style.removeProperty('--cratis-z-index-dialog');
        await unmount(first);
    });

    it('should give each dialog a distinct z-index', () => {
        expect(firstZIndex).to.not.equal(secondZIndex);
    });

    it('should stack the dialog opened later above the one that was already open', () => {
        expect(secondZIndex).to.be.greaterThan(firstZIndex);
    });
});
