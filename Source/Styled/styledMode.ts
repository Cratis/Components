// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CratisComponentsConfig } from '../Common/CratisComponentsProvider';

/** Legacy cascade-layer name retained for migration tooling. */
export const primeReactCssLayer = 'primereact';
/** Legacy cascade-layer order retained for migration tooling. */
export const primeReactCssLayerOrder = 'theme, base, primereact, components, utilities';
/** Default selector used by the Cratis token/theme stylesheets. */
export const cratisDarkModeSelector = '.cratis-dark';

export interface StyledModeOptions {
    /** Legacy renderer preset. Ignored by the renderer-independent package. */
    preset?: unknown;
    /** Dark selector retained for source compatibility. */
    darkModeSelector?: string;
    /** Legacy renderer cascade layer. Ignored by the renderer-independent package. */
    cssLayer?: false | string | { name: string; order?: string };
}

/**
 * Legacy provider helper retained for source compatibility.
 *
 * Components is now styled by importing `@cratis/components/tokens`,
 * `@cratis/components/styles`, and optionally `@cratis/components/theme`.
 * The helper returns an empty configuration and can be removed from application code.
 */
export const styledMode = (
    _options: StyledModeOptions = {},
): CratisComponentsConfig => ({});
