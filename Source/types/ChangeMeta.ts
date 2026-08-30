// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Describes the origin of a Components-owned value change.
 *
 * Components may omit this object when no trustworthy origin information is available.
 * Consumers must therefore treat metadata as supplementary context rather than as the value
 * transport itself.
 */
export interface ChangeMeta {
    /**
     * Identifies the change origin.
     *
     * `user` denotes an interaction, `programmatic` denotes an imperative component action,
     * and `reset` denotes restoration of an earlier or default value.
     */
    readonly source: 'user' | 'programmatic' | 'reset';
    /**
     * Native browser event that caused the change, when one exists at the public boundary.
     *
     * This is always a DOM {@link Event}; React synthetic events and renderer-specific event
     * objects are never exposed through this property. Use it only for immediate interaction
     * handling—do not serialize, log, or transmit it because native events can retain references
     * to form controls and user input.
     */
    readonly nativeEvent?: Event;
}
