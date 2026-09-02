// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Renderer-independent attributes accepted by a stable {@link NumberInput} part. */
export interface NumberInputPartAttributes {
    /** Additional CSS class for the part. */
    className?: string;
    /** Inline style values for the part, including consumer-owned custom properties. */
    style?: Readonly<Record<string, string | number | undefined>>;
    /** Advisory text for the part. */
    title?: string;
    /** Consumer-owned data attributes. */
    [attribute: `data-${string}`]: string | number | boolean | undefined;
}
