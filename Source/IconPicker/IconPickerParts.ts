// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes } from 'react';

/** Attributes passed through to one part of an {@link IconPicker}, including `data-*` attributes. */
export type IconPickerPartAttributes<TElement> = HTMLAttributes<TElement> & {
    [attribute: `data-${string}`]: string | number | boolean | undefined;
};

/**
 * Stable Cratis-owned parts for styling an {@link IconPicker}. Each is marked with a matching
 * `data-cratis-part` attribute, and what is passed here is spread onto that element - the picker's own
 * value, selection and event wiring always win.
 */
export interface IconPickerParts {
    /** The wrapper around the trigger and its messages. Carries `data-disabled`, `data-invalid`, `data-readonly` and `data-open`. */
    root?: IconPickerPartAttributes<HTMLDivElement>;

    /** The closed control that opens the popout. Carries `data-disabled`, `data-invalid`, `data-readonly`, `data-open` and `data-missing`. */
    trigger?: IconPickerPartAttributes<HTMLButtonElement>;

    /** The selected icon's glyph inside the trigger. */
    glyph?: IconPickerPartAttributes<HTMLSpanElement>;

    /** The selected icon's name inside the trigger. */
    name?: IconPickerPartAttributes<HTMLSpanElement>;

    /** The validation and missing-selection messages under the trigger. */
    message?: IconPickerPartAttributes<HTMLParagraphElement>;

    /** The popout, or the sheet it becomes on a narrow viewport. Carries `data-open`. */
    popover?: IconPickerPartAttributes<HTMLElement>;

    /** The dialog inside the popout. */
    dialog?: IconPickerPartAttributes<HTMLElement>;

    /** The popout's title. */
    title?: IconPickerPartAttributes<HTMLHeadingElement>;

    /** The button that closes the popout. */
    close?: IconPickerPartAttributes<HTMLButtonElement>;

    /** The search field. */
    search?: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'type'> & {
        [attribute: `data-${string}`]: string | number | boolean | undefined;
    };

    /** The button that clears the search. */
    clear?: IconPickerPartAttributes<HTMLButtonElement>;

    /** The row of category filters. */
    categories?: IconPickerPartAttributes<HTMLDivElement>;

    /** Every category filter. Carries `data-selected` on the active one. */
    category?: IconPickerPartAttributes<HTMLButtonElement>;

    /** The library filter, shown when the catalog holds more than one library. */
    library?: IconPickerPartAttributes<HTMLSelectElement>;

    /** The line stating what is showing. */
    summary?: IconPickerPartAttributes<HTMLParagraphElement>;

    /** The loading, empty, no-results and error states. Carries `data-loading` while the catalog loads. */
    status?: IconPickerPartAttributes<HTMLDivElement>;

    /** One compact category group. */
    group?: IconPickerPartAttributes<HTMLElement>;

    /** The title of a category group. */
    groupTitle?: IconPickerPartAttributes<HTMLHeadingElement>;

    /** The button that opens a whole category from its group. */
    showAll?: IconPickerPartAttributes<HTMLButtonElement>;

    /** A grid of tiles. */
    grid?: IconPickerPartAttributes<HTMLDivElement>;

    /** One icon tile. Carries `data-selected` and `data-disabled`. */
    tile?: IconPickerPartAttributes<HTMLDivElement>;

    /** The fixed area a tile centers its glyph in. */
    tileIcon?: IconPickerPartAttributes<HTMLSpanElement>;

    /** The name beneath a tile's glyph. */
    tileName?: IconPickerPartAttributes<HTMLSpanElement>;

    /** The library a tile or the trigger names, shown when several libraries are offered. */
    provider?: IconPickerPartAttributes<HTMLSpanElement>;

    /** The credit line for the libraries on offer. */
    attribution?: IconPickerPartAttributes<HTMLParagraphElement>;
}
