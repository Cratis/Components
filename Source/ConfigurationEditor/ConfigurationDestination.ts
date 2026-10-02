// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * A target an item can point at, supplied by the host. The editor lists and selects destinations;
 * it never resolves them, navigates to them or discovers them from an application.
 */
export interface ConfigurationDestination {
    /** Stable identity stored on the item. Never the label. */
    id: string;

    /** Localizable name shown to the person choosing. */
    label: string;

    /** Optional group the destination is listed under. */
    group?: string;
}
