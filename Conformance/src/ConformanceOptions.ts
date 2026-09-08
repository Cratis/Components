// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType, ReactNode } from 'react';
import type { AdapterPackageMetadata } from './AdapterPackageMetadata.js';
import type { ConformanceSkipRequest } from './ConformanceSkipRequest.js';

/** Options for a bounded conformance run. */
export interface ConformanceOptions {
    /** Static `package.json#cratis` metadata for runtime/static consistency checks. */
    readonly metadata?: AdapterPackageMetadata | Readonly<Record<string, unknown>>;
    /** DOM document used for runtime checks. Defaults to `globalThis.document`. */
    readonly document?: Document;
    /** Enables axe-core evidence. Defaults to `true`. */
    readonly axe?: boolean;
    /** Optional application-owned outer provider required by a vendor renderer. */
    readonly wrapper?: ComponentType<{ readonly children: ReactNode }>;
    /** Explicit omissions, accepted only when fidelity/capability declarations justify them. */
    readonly skips?: readonly ConformanceSkipRequest[];
}
