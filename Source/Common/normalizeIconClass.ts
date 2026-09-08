// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** The outcome of normalizing a string icon value into a renderable CSS class. */
export interface NormalizedIconClass {
    /** The CSS class to apply to the `<i>` element. Empty when there is nothing to render. */
    className: string;
}

/**
 * Trims a consumer-owned icon-font CSS class for {@link IconDisplay}.
 *
 * Components does not infer an icon provider or add provider-specific base classes. Pass the
 * complete class string required by the icon font, or prefer a React icon node.
 *
 * @param icon - The complete consumer-owned icon CSS class.
 * @returns The trimmed class to render.
 */
export function normalizeIconClass(icon: string): NormalizedIconClass {
    return { className: icon.trim() };
}
