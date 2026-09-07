// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import {
    closeDialogTier,
    DIALOG_TIER_STEP,
    DIALOG_ZINDEX_TOKEN,
    dialogZIndexForTier,
    OVERLAY_OFFSET,
    openDialogTier,
    TOOLTIP_OFFSET,
    zIndexAboveDialog,
} from '../dialogStack';

// The registry is module-level state shared by every dialog, so a spec that reserves a tier has to
// give it back - otherwise the next spec starts from a non-zero tier and asserts against the wrong
// expression.
const reservedTiers: number[] = [];
const reserveTier = () => {
    const tier = openDialogTier();
    reservedTiers.push(tier);
    return tier;
};

afterEach(() => {
    while (reservedTiers.length > 0) closeDialogTier(reservedTiers.pop()!);
});

describe('when resolving dialog z indexes', () => {
    it('should resolve the first tier to the dialog token itself', () => {
        expect(dialogZIndexForTier(0)).to.equal(DIALOG_ZINDEX_TOKEN);
    });

    it('should keep every tier relative to the dialog token', () => {
        // The regression this guards: resolving a tier to a bare number discards an application's
        // override of --cratis-z-index-dialog, dropping the dialog back into the default band and
        // behind any app chrome the token was raised above.
        for (const tier of [1, 2, 5]) {
            expect(dialogZIndexForTier(tier)).to.contain(DIALOG_ZINDEX_TOKEN);
        }
    });

    it('should offset each tier by a whole number of tier steps', () => {
        expect(dialogZIndexForTier(1)).to.equal(`calc(${DIALOG_ZINDEX_TOKEN} + ${DIALOG_TIER_STEP})`);
        expect(dialogZIndexForTier(3)).to.equal(`calc(${DIALOG_ZINDEX_TOKEN} + ${3 * DIALOG_TIER_STEP})`);
    });

    it('should never resolve a tier to a bare number', () => {
        for (const tier of [0, 1, 4]) {
            expect(Number.isNaN(Number(dialogZIndexForTier(tier)))).to.be.true;
        }
    });

    it('should stack a popover above its owning dialog without losing the token', () => {
        const dialogZIndex = dialogZIndexForTier(0);
        const popover = zIndexAboveDialog(dialogZIndex, OVERLAY_OFFSET);
        expect(popover).to.equal(`calc(${DIALOG_ZINDEX_TOKEN} + ${OVERLAY_OFFSET})`);
        expect(popover).to.contain(DIALOG_ZINDEX_TOKEN);
    });

    it('should stack a popover above a nested dialog relative to that dialog', () => {
        const nested = dialogZIndexForTier(2);
        expect(zIndexAboveDialog(nested, TOOLTIP_OFFSET)).to.equal(`calc(${nested} + ${TOOLTIP_OFFSET})`);
    });

    it('should hand out strictly increasing tiers while dialogs stay open', () => {
        expect(reserveTier()).to.equal(0);
        expect(reserveTier()).to.equal(1);
        expect(reserveTier()).to.equal(2);
    });

    it('should restart tiers once every dialog has closed', () => {
        const first = openDialogTier();
        const second = openDialogTier();
        closeDialogTier(second);
        closeDialogTier(first);
        expect(reserveTier()).to.equal(0);
    });

    it('should keep counting up while any dialog is still open', () => {
        const outer = reserveTier();
        const inner = openDialogTier();
        closeDialogTier(inner);
        expect(reserveTier()).to.be.greaterThan(outer);
    });
});
