// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Public structural view accepted by the conformance runner.
 *
 * `unstable_UiLibrary` satisfies this shape without leaking Components component or renderer-vendor
 * declarations through the conformance package's separately packaged public types.
 */
export interface ConformanceLibrary {
    readonly id: string;
    readonly displayName: string;
    readonly abi: number;
    readonly level: 'full' | 'primitive' | 'behavior' | 'portal' | 'theme';
    readonly profile: string;
    readonly profileSlots?: readonly string[];
    readonly capabilities: readonly string[];
    readonly slots: object;
    readonly Provider?: unknown;
    readonly preflight?: unknown;
}
