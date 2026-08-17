// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSLayer, ThemeOptions } from '@primereact/types/core';
import type { CratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { CratisPreset } from './CratisPreset';
import { primeReactStyles } from './primeReactStyles';

/**
 * The cascade layer PrimeReact's theme is emitted into by default. Rules in a layer lose
 * to unlayered rules regardless of specificity or order, which is what lets an
 * application's own stylesheet override the theme with a plain selector — exactly the
 * relationship PrimeReact 10's stylesheet themes had, since they were wrapped in
 * `@layer primereact` too.
 */
export const primeReactCssLayer = 'primereact';

/**
 * The layer order declared with the theme by default. PrimeReact writes its `@layer`
 * statement ahead of every other stylesheet, so this is what fixes the order — and it
 * has to name Tailwind's layers, which `@cratis/components/styles` declares in every
 * consumer: the theme sits above `base`, so Tailwind's preflight reset does not strip the
 * padding and borders the theme gives a table cell or an input, and below `components`
 * and `utilities`, so a utility class on a PrimeReact element still wins.
 */
export const primeReactCssLayerOrder = 'theme, base, primereact, components, utilities';

/**
 * The selector that switches the theme to its dark scheme by default. It is the class
 * the Cratis baseline theme keys its dark palette off as well, so one `class="cratis-dark"`
 * on the body serves both.
 */
export const cratisDarkModeSelector = '.cratis-dark';

export interface StyledModeOptions {
    /**
     * The `@primeuix/themes` preset to style with. Defaults to {@link CratisPreset}, the
     * PrimeReact 10 look of Cratis applications; any preset — Aura, Nora, Material, or
     * one derived with `definePreset` — works.
     */
    preset?: unknown;

    /**
     * How the dark scheme is activated. A selector such as `.my-dark`, `'system'` for the
     * `prefers-color-scheme` media query, or `'none'` to stay light. Defaults to
     * {@link cratisDarkModeSelector}.
     */
    darkModeSelector?: ThemeOptions['darkModeSelector'];

    /**
     * The cascade layer to emit the theme into, or `false` to emit it unlayered — in
     * which case the theme's rules compete with the application's on specificity and
     * order alone, and being injected at runtime they arrive last. Defaults to
     * {@link primeReactCssLayer} ordered by {@link primeReactCssLayerOrder}. A string
     * names the layer and keeps that order with the name swapped in; a `{ name, order }`
     * object is used as given.
     */
    cssLayer?: false | string | CSSLayer;
}

/**
 * Configures {@link CratisComponentsProvider} for PrimeReact 11's styled mode: a
 * `@primeuix/themes` preset for the design tokens, and PrimeReact's own component styles
 * ({@link primeReactStyles}) so every primitive — those rendered by this library and those
 * the application renders itself — carries the `p-*` class names that preset paints.
 *
 * Spread the result into the provider's `value`, next to the license key and anything
 * else the application configures:
 *
 * ```tsx
 * import { CratisComponentsProvider } from '@cratis/components';
 * import { styledMode } from '@cratis/components/styled';
 *
 * <CratisComponentsProvider value={{ license, ...styledMode() }}>
 * ```
 *
 * The theme goes into the `primereact` cascade layer, so a plain `.p-button { … }` in the
 * application's own stylesheet overrides it just as it did on PrimeReact 10 — see
 * {@link primeReactCssLayerOrder} for where that layer sits relative to Tailwind's.
 */
export const styledMode = (options: StyledModeOptions = {}): Pick<CratisComponentsConfig, 'theme' | 'defaults'> => {
    const cssLayer = options.cssLayer === undefined
        ? { name: primeReactCssLayer, order: primeReactCssLayerOrder }
        : typeof options.cssLayer === 'string'
            ? { name: options.cssLayer, order: primeReactCssLayerOrder.replace(primeReactCssLayer, options.cssLayer) }
            : options.cssLayer;

    return {
        theme: {
            preset: options.preset ?? CratisPreset,
            options: {
                darkModeSelector: options.darkModeSelector ?? cratisDarkModeSelector,
                cssLayer,
            },
        },
        defaults: primeReactStyles,
    };
};
