// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** An icon library a host offers through an {@link IconPickerCatalog}: where its icons come from. */
export interface IconPickerLibrary {
    /** The stable identity of the library. Every entry's `library` refers to it. */
    id: string;

    /** The name shown to people to tell this library's icons from another's. */
    name: string;

    /** The version of the library, shown beside its attribution when supplied. */
    version?: string;

    /** The attribution or license notice the library requires, shown when supplied. */
    attribution?: string;
}
