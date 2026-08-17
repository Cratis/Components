// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

/**
 * A `@primeuix/themes` preset with the look Cratis applications had on PrimeReact 10.
 *
 * Every Cratis application shipped `lara-dark-blue` (and `lara-light-blue` where a light
 * scheme was offered). Lara is still PrimeReact's design system in version 11, so this
 * starts from it and moves the palette back to what those themes used: a blue primary
 * over gray surfaces.
 *
 * The dark surface scale is shifted one step lighter than the light one. Lara's dark
 * scheme places content on `surface.900`, form fields and the page on `surface.950`, and
 * borders and hovers on `surface.800`; the v10 dark theme had cards, tables, dialogs and
 * dropdown panels on `#1f2937` (gray 800) over a `#111827` (gray 900) page, with inputs on
 * the page tone. Mapping dark `surface.900` to gray 800 and `surface.950` to gray 900
 * reproduces exactly that through Lara's own component tokens, without overriding any
 * of them — so borders, hovers and selection stay one visible step apart from the
 * surfaces they sit on.
 *
 * Both color schemes are carried; which one applies follows the provider's
 * `darkModeSelector`. Extend it the way you would any preset:
 *
 * ```ts
 * import { definePreset } from '@primeuix/themes';
 * import { CratisPreset } from '@cratis/components/styled';
 *
 * const MyPreset = definePreset(CratisPreset, { semantic: { primary: { ... } } });
 * ```
 */
export const CratisPreset = definePreset(Lara, {
    semantic: {
        primary: {
            50: '{blue.50}',
            100: '{blue.100}',
            200: '{blue.200}',
            300: '{blue.300}',
            400: '{blue.400}',
            500: '{blue.500}',
            600: '{blue.600}',
            700: '{blue.700}',
            800: '{blue.800}',
            900: '{blue.900}',
            950: '{blue.950}',
        },
        surface: {
            0: '#ffffff',
            50: '{gray.50}',
            100: 'light-dark({gray.100}, {gray.50})',
            200: 'light-dark({gray.200}, {gray.100})',
            300: 'light-dark({gray.300}, {gray.200})',
            400: 'light-dark({gray.400}, {gray.300})',
            500: 'light-dark({gray.500}, {gray.400})',
            600: 'light-dark({gray.600}, {gray.500})',
            700: 'light-dark({gray.700}, {gray.600})',
            800: 'light-dark({gray.800}, {gray.700})',
            900: 'light-dark({gray.900}, {gray.800})',
            950: 'light-dark({gray.950}, {gray.900})',
        },
    },
    components: {
        // Lara raises a table's head and foot one step above its rows; the v10 dark theme
        // kept them on the row tone and told them apart by weight and a border, as the
        // Workbench and Studio tables were designed around.
        datatable: {
            header: { background: 'light-dark({surface.50}, {content.background})' },
            headerCell: {
                background: 'light-dark({surface.50}, {content.background})',
                selectedBackground: 'light-dark({surface.50}, {content.background})',
            },
            footer: { background: 'light-dark({surface.50}, {content.background})' },
            footerCell: { background: 'light-dark({surface.50}, {content.background})' },
        },
    },
});
