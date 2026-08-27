// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Describes the origin of a Components-owned value change. */
export interface ChangeMeta {
    /** Identifies whether the value came from user interaction, programmatic work, or a reset. */
    readonly source: 'user' | 'programmatic' | 'reset';
    /** Native browser event that caused the change, when the component boundary exposes one safely. */
    readonly nativeEvent?: Event;
}
