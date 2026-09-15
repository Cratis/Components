// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Assigns each currently open {@link DialogImplementation} a strictly increasing tier so that
 * multiple simultaneously open dialogs - opened from anywhere in the tree, not necessarily nested
 * as React children of one another - stack in the order they opened instead of colliding on one
 * static z-index. Mirrors the incrementing registry PrimeReact's own ZIndexUtils used to provide,
 * which the removed `useOverlayZIndex` hook depended on before Components 4 moved Dialog off
 * PrimeReact and onto React Aria.
 */
let nextDialogTier = 0;
const openDialogTiers = new Set<number>();

/** Reserves the next dialog tier. Pair with {@link closeDialogTier} when the dialog closes. */
export const openDialogTier = (): number => {
    const tier = nextDialogTier;
    nextDialogTier += 1;
    openDialogTiers.add(tier);
    return tier;
};

/** Releases a tier reserved by {@link openDialogTier}. Resets the counter once nothing is open. */
export const closeDialogTier = (tier: number): void => {
    openDialogTiers.delete(tier);
    if (openDialogTiers.size === 0) nextDialogTier = 0;
};

/**
 * The custom property every tier is measured from. Tiers resolve to a CSS expression built on this
 * token rather than to a plain number, because an application is expected to retune the token to fit
 * its own stacking order - Cratis Studio, for example, raises it to 10100 so dialogs clear the
 * full-screen overlay its settings pages live in. Resolving a tier to a bare number would discard
 * that override and pin every dialog back to the default band, behind whatever opened it.
 */
export const DIALOG_ZINDEX_TOKEN = 'var(--cratis-z-index-dialog)';

/** The default value of {@link DIALOG_ZINDEX_TOKEN}, for applications that do not override it. */
export const DIALOG_BASE_ZINDEX = 1100;

/**
 * Gap between two dialog tiers. Large enough that a second-tier dialog, and everything it hosts
 * (its own overlay/filter/tooltip offsets below), stays above every static token band a first-tier
 * dialog's own popovers use (dialog 1100 .. tooltip 1300 today).
 */
export const DIALOG_TIER_STEP = 1000;

/** Offset above its owning dialog a dropdown/date-picker popover uses - mirrors the static overlay token gap. */
export const OVERLAY_OFFSET = 100;

/** Offset above its owning dialog a column filter menu uses - mirrors the static filter token gap. */
export const FILTER_OFFSET = 150;

/** Offset above its owning dialog a tooltip uses - mirrors the static tooltip token gap. */
export const TOOLTIP_OFFSET = 200;

/**
 * Resolves the z-index a dialog at the given tier should use, as a CSS expression relative to
 * {@link DIALOG_ZINDEX_TOKEN} so an application's override of that token is preserved. The first
 * tier is the token itself, so a lone dialog stacks exactly where it did before tiering existed.
 */
export const dialogZIndexForTier = (tier: number): string =>
    tier === 0 ? DIALOG_ZINDEX_TOKEN : `calc(${DIALOG_ZINDEX_TOKEN} + ${tier * DIALOG_TIER_STEP})`;

/**
 * Stacks an overlay-producing descendant - a dropdown or date-picker popover, a filter menu, a
 * tooltip - the given offset above its owning dialog, keeping it relative to whatever expression
 * that dialog resolved to.
 */
export const zIndexAboveDialog = (dialogZIndex: string, offset: number): string =>
    `calc(${dialogZIndex} + ${offset})`;
