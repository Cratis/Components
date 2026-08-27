// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Static `package.json#cratis` metadata validated against the public adapter schema. */
export interface AdapterPackageMetadata {
    readonly kind: 'ui-adapter';
    readonly id: string;
    readonly displayName: string;
    readonly abi: string;
    readonly level: 'full' | 'primitive' | 'behavior' | 'portal' | 'theme';
    readonly profile: string;
    readonly category: string;
    readonly entry: string;
    readonly export: string;
    readonly slots: readonly string[];
    readonly modes: Readonly<Record<string, 'presentation' | 'atomic'>>;
    readonly capabilities: readonly string[];
    readonly ssr: 'safe' | 'client-only' | 'hydration-risk';
    readonly a11y: {
        readonly axeProfile: 'wcag21a' | 'wcag21aa' | 'wcag22a' | 'wcag22aa';
        readonly evidence: string;
    };
    readonly license: {
        readonly spdx: string;
        readonly requiresKey: boolean;
        readonly keyEnv?: string;
        readonly url?: string;
    };
    readonly upstream: Readonly<Record<string, string>>;
}
