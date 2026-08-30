// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Host environment used by overlay implementations to obtain their portal container.
 * `null` means no container is currently available; callers must defer rather than retarget.
 *
 */
export interface CratisOverlayEnvironment {
    /** Resolves the current overlay container without requiring browser globals during import. */
    getContainer(): HTMLElement | null;
}

/**
 * Compatibility alias for {@link CratisOverlayEnvironment}.
 *
 * @deprecated Use {@link CratisOverlayEnvironment}.
 */
export type unstable_CratisOverlayEnvironment = CratisOverlayEnvironment;

/**
 * Default browser overlay environment. The module is SSR-safe: `document` is inspected only when
 * `getContainer()` is invoked, never while this module is initialized.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export const unstable_defaultOverlayEnvironment: unstable_CratisOverlayEnvironment =
    Object.freeze({
        getContainer: (): HTMLElement | null =>
            typeof document === 'undefined' ? null : document.body,
    });
