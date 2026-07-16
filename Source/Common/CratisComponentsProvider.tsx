// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useMemo } from 'react';
import { PrimeReactProvider } from '@primereact/core';
import type { PrimeReactProps } from '@primereact/types/core';
import { merge } from 'ts-deepmerge';
import { Toaster, type ToasterProps } from '../Notifications';

/**
 * Configuration accepted by {@link CratisComponentsProvider}. Mirrors PrimeReact 11's
 * {@link PrimeReactProps} — the most commonly used members are `unstyled`, `pt`, `ptOptions`,
 * `ripple`, `inputVariant`, `zIndex`, `locale`, and `theme` (`{ preset, options }` for the
 * `@primeuix/themes` styled layer).
 */
export type CratisComponentsConfig = Partial<PrimeReactProps>;

export interface CratisComponentsProviderProps {
    /**
     * Cratis-wide and PrimeReact pass-through configuration. Merged on top of the
     * library's defaults and made available to every Cratis component below in the tree.
     */
    value?: CratisComponentsConfig;

    /**
     * When set, mounts a {@link Toaster} inside the provider so the imperative
     * `toast(...)` works app-wide with no extra setup. Pass `true` for the
     * defaults, or a {@link ToasterProps} object to position/configure it.
     */
    toaster?: boolean | ToasterProps;

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
 * Single setup point for Cratis Components. Wraps PrimeReact 11's
 * {@link PrimeReactProvider} so the library can layer Cratis-wide defaults on top of
 * PrimeReact's pass-through and unstyled mechanisms while still letting the consumer
 * take complete control. PrimeReact 11 is unstyled-first, so this library ships no
 * bundled theme — you choose the styling posture:
 *
 * - **Unstyled (default posture):** pass nothing, or `unstyled: true`, and style the
 *   structural markup yourself through the `--cratis-*` token layer, your own CSS,
 *   Tailwind, or `pt` definitions.
 * - **Styled:** pass `theme={{ preset }}` with a `@primeuix/themes` preset (for example
 *   `import Aura from '@primeuix/themes/aura'`) to opt into a token-based styled look.
 * - Pass `pt` / `ptOptions` to apply global per-component pass-through.
 *
 * **PrimeUI license.** PrimeReact 11 is no longer MIT — its provider verifies a PrimeUI
 * license on mount and, without one, logs a warning and shows an "Invalid PrimeUI License"
 * banner (in development *and* production). Supply your key via `value={{ license: '…' }}`
 * (a free Community tier covers individuals, non-profits, non-commercial OSS, and small
 * orgs; otherwise a Commercial license is required — see primeui.store). The key flows
 * straight through to PrimeReact's provider.
 *
 * Consumers who want to talk to PrimeReact directly may still mount
 * {@link PrimeReactProvider} themselves — this component is an optional convenience,
 * not a requirement.
 */
export const CratisComponentsProvider = ({ value, toaster, children }: CratisComponentsProviderProps) => {
    const merged = useMemo<CratisComponentsConfig>(() => mergeCratisComponentsConfig(value), [value]);

    return (
        <PrimeReactProvider {...merged}>
            {children}
            {toaster && <Toaster {...(typeof toaster === 'object' ? toaster : {})} />}
        </PrimeReactProvider>
    );
};
