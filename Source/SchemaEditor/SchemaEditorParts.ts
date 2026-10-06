// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes } from 'react';

/** Attributes passed through to one part of the editor, including `data-*` attributes. */
export type SchemaEditorPartAttributes<TElement> = HTMLAttributes<TElement> & {
    [attribute: `data-${string}`]: string | number | boolean | undefined;
};

/** Styling attributes passed to a part the editor renders through a popover menu. */
export type SchemaEditorMenuPartAttributes = Pick<HTMLAttributes<HTMLElement>, 'className' | 'style'> & {
    [attribute: `data-${string}`]: string | number | boolean | undefined;
};

/**
 * Stable Cratis-owned parts for styling a {@link SchemaEditor}. Each is marked with a matching
 * `data-cratis-part` attribute and receives what is passed here; the editor's own wiring wins.
 */
export interface SchemaEditorParts {
    /** The editor root. Carries `data-readonly` while the editor is read-only. */
    root?: SchemaEditorPartAttributes<HTMLDivElement>;

    /** The wrapper of the host's `header`. */
    header?: SchemaEditorPartAttributes<HTMLDivElement>;

    /** A list of properties: the root list, or the properties nested under a property. */
    list?: SchemaEditorPartAttributes<HTMLUListElement>;

    /** One property with everything nested under it. Carries `data-property-type`. */
    property?: SchemaEditorPartAttributes<HTMLLIElement>;

    /** The row of one property. Carries `data-selected` while the host marks it selected. */
    row?: SchemaEditorPartAttributes<HTMLDivElement>;

    /** The wrapper of the host's leading slot. */
    leading?: SchemaEditorPartAttributes<HTMLSpanElement>;

    /** The control that shows the name and starts renaming. */
    name?: ButtonHTMLAttributes<HTMLButtonElement>;

    /** The input shown while renaming. Carries `data-invalid` for a name that cannot be used. */
    nameInput?: InputHTMLAttributes<HTMLInputElement>;

    /** The read-only badge of a property's type. */
    badge?: SchemaEditorPartAttributes<HTMLSpanElement>;

    /** The button that opens the menu of types. */
    typeButton?: ButtonHTMLAttributes<HTMLButtonElement>;

    /** The popover of the menu of types. */
    menu?: SchemaEditorMenuPartAttributes;

    /** One entry of the menu of types. */
    menuItem?: SchemaEditorMenuPartAttributes;

    /** The label of the required toggle. */
    required?: SchemaEditorPartAttributes<HTMLLabelElement>;

    /** The key toggle. Carries `data-pressed` while the property is the key. */
    key?: ButtonHTMLAttributes<HTMLButtonElement>;

    /** The wrapper of the host's accessory slot. */
    accessory?: SchemaEditorPartAttributes<HTMLSpanElement>;

    /** The button that removes a property. */
    remove?: ButtonHTMLAttributes<HTMLButtonElement>;

    /** The marker shown instead of the remove button for a protected property. */
    protected?: SchemaEditorPartAttributes<HTMLSpanElement>;

    /** The wrapper of the host's details slot, shown under the row. */
    details?: SchemaEditorPartAttributes<HTMLDivElement>;

    /** The button that adds a property, at the root or in a nested object. */
    add?: ButtonHTMLAttributes<HTMLButtonElement>;

    /** The text shown when there are no properties. */
    empty?: SchemaEditorPartAttributes<HTMLParagraphElement>;

    /** A validation message. */
    message?: SchemaEditorPartAttributes<HTMLParagraphElement>;

    /** The wrapper of the host's `footer`, beside the add button. */
    footer?: SchemaEditorPartAttributes<HTMLDivElement>;
}
