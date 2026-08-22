// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    DataTableFilterMatchMode,
    type DataTableCustomFilterMatchMode,
    type DataTableFilterMatcher,
} from './DataTableFilterMeta';

interface DataTableFilterMatcherAdapter {
    register(name: string, matcher: DataTableFilterMatcher): void;
    unregister(name: string): void;
}

interface RegisteredMatcher {
    matcher: DataTableFilterMatcher;
    owners: Set<symbol>;
}

interface MatcherRegistryState {
    matchers: Map<string, RegisteredMatcher>;
    adapters: Set<DataTableFilterMatcherAdapter>;
}

/** Handle returned for one custom matcher registration. */
export interface DataTableFilterMatcherRegistration {
    matchMode: DataTableCustomFilterMatchMode;
    unregister(): void;
}

const registryKey = Symbol.for('@cratis/components/data-table-filter-matchers/v2');
// SAFETY: Symbol.for gives every loaded Components copy the same isolated registry slot.
const registryHost = globalThis as unknown as Record<
    symbol,
    MatcherRegistryState | undefined
>;
const registry = (registryHost[registryKey] ??= {
    matchers: new Map<string, RegisteredMatcher>(),
    adapters: new Set<DataTableFilterMatcherAdapter>(),
});
const builtInMatchModes = new Set<string>(Object.values(DataTableFilterMatchMode));

/**
 * Registers a process-wide custom matcher through the Cratis filter vocabulary.
 * Reusing a name is allowed only with the same matcher function.
 */
export const registerDataTableFilterMatcher = (
    name: string,
    matcher: DataTableFilterMatcher,
): DataTableFilterMatcherRegistration => {
    if (builtInMatchModes.has(name)) {
        throw new Error(
            `'${name}' is a built-in data-table filter match mode and cannot be replaced.`,
        );
    }

    const existing = registry.matchers.get(name);
    if (existing && existing.matcher !== matcher) {
        throw new Error(
            `A different data-table filter matcher is already registered as '${name}'.`,
        );
    }

    const owner = Symbol(name);
    const registered = existing ?? { matcher, owners: new Set<symbol>() };
    registered.owners.add(owner);
    registry.matchers.set(name, registered);
    if (!existing) {
        registry.adapters.forEach((current) => current.register(name, matcher));
    }

    // SAFETY: The branded value is returned only with a live registration handle.
    const matchMode = name as DataTableCustomFilterMatchMode;
    let active = true;
    const unregister = () => {
        if (!active) return;
        active = false;

        const current = registry.matchers.get(name);
        if (!current || current.matcher !== matcher) return;
        current.owners.delete(owner);
        if (current.owners.size > 0) return;

        registry.matchers.delete(name);
        registry.adapters.forEach((currentAdapter) => currentAdapter.unregister(name));
    };

    return { matchMode, unregister };
};

/** Removes a custom matcher registration. Safe to call more than once. */
export const unregisterDataTableFilterMatcher = (
    registration: DataTableFilterMatcherRegistration,
): void => registration.unregister();

/** Connects the active rendering adapter to the Cratis-owned matcher registry. */
export const attachDataTableFilterMatcherAdapter = (
    next: DataTableFilterMatcherAdapter,
): void => {
    const alreadyAttached = Array.from(registry.adapters).some(
        (current) =>
            current.register === next.register && current.unregister === next.unregister,
    );
    if (alreadyAttached) return;

    registry.adapters.add(next);
    registry.matchers.forEach((entry, name) => next.register(name, entry.matcher));
};
