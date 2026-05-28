// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useMemo } from 'react';
import { PrimeReactProvider } from 'primereact/api';
import type { APIOptions } from 'primereact/api';
import { merge } from 'ts-deepmerge';

/**
 * Configuration accepted by {@link CratisComponentsProvider}. Mirrors PrimeReact's
 * {@link APIOptions} — the most commonly used members are `unstyled`, `pt`, `ptOptions`,
 * `inputStyle`, `ripple`, `appendTo`, `zIndex` and `locale`.
 */
export type CratisComponentsConfig = Partial<APIOptions>;

export interface CratisComponentsProviderProps {
    /**
     * Cratis-wide and PrimeReact pass-through configuration. Merged on top of the
     * library's defaults and made available to every Cratis component below in the tree.
     */
    value?: CratisComponentsConfig;

    children: React.ReactNode;
}

/**
 * Default configuration applied to every consumer. Intentionally empty today —
 * reserved for Cratis-wide opinions we may want to ship in the future (for example,
 * a default pt preset that complements the --cratis-* token layer). Anything added
 * here is deep-merged with the consumer's `value` so consumer settings always win.
 *
 * Exported so specs can verify the merge contract without re-rendering React.
 */
export const cratisDefaults: CratisComponentsConfig = {};

/**
 * Pure merge of {@link cratisDefaults} and consumer-supplied config. Exposed for
 * specs; the provider component uses the same logic inside its `useMemo`.
 */
export const mergeCratisComponentsConfig = (value: CratisComponentsConfig | undefined): CratisComponentsConfig =>
    merge(cratisDefaults, value ?? {}) as CratisComponentsConfig;

/**
 * Single setup point for Cratis Components. Wraps {@link PrimeReactProvider} so the
 * library can layer Cratis-wide defaults on top of PrimeReact's pass-through and
 * unstyled mechanisms while still letting the consumer take complete control:
 *
 * - Pass `unstyled: true` to disable every PrimeReact base style. The wrappers in
 *   this package then render structurally only and pick up all visuals from your
 *   own CSS, Tailwind, or pt definitions.
 * - Pass `pt` / `ptOptions` to apply global per-component pass-through.
 *
 * Consumers who want to talk to PrimeReact directly may still mount
 * {@link PrimeReactProvider} themselves — this component is an optional convenience,
 * not a requirement.
 */
export const CratisComponentsProvider = ({ value, children }: CratisComponentsProviderProps) => {
    const merged = useMemo<CratisComponentsConfig>(() => mergeCratisComponentsConfig(value), [value]);

    return <PrimeReactProvider value={merged}>{children}</PrimeReactProvider>;
};
