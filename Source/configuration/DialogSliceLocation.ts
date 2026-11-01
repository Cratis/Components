// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Where a dialog's opener sits in the application: the module, feature and slice that own it.
 * Components only carries the value; the host (or Arc) supplies it.
 */
export interface DialogSliceLocation {
    /** Module name. */
    module: string;
    /** Feature name within the module. */
    feature: string;
    /** Slice name within the feature. */
    slice: string;
}
