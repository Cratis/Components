// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export interface AdapterMetadata {
    readonly kind: 'ui-adapter';
    readonly id: string;
    readonly displayName: string;
    readonly category: string;
    readonly export: string;
    readonly upstream: Readonly<Record<string, string>>;
}

export interface AdapterInventoryEntry {
    readonly packageName: string;
    readonly packageDirectory: string;
    readonly packageFile: string;
    readonly metadata: AdapterMetadata;
    readonly setupFile?: string;
    readonly sourceEntry?: string;
    readonly expectedUpstreamVersion?: string;
    readonly builtIn: boolean;
}

export interface AdapterInventory {
    readonly adapters: readonly AdapterInventoryEntry[];
    readonly exclusions: readonly {
        readonly packageName: string;
        readonly id: string;
        readonly reason: string;
    }[];
    readonly packageFiles: readonly string[];
}

export function discoverAdapterPackages(repositoryRoot: string): AdapterInventory;
export function requireAdapter(inventory: AdapterInventory, id: string): AdapterInventoryEntry;
