// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { useMemo } from 'react';
import { PrimeReactProvider } from '@primereact/core';
import type { PrimeReactProps } from '@primereact/types/core';
import { merge } from 'ts-deepmerge';
import { Toaster, type ToasterProps } from '../Notifications';

/** Z-index categories used by overlay-capable rendering adapters. */
export interface CratisZIndexConfig {
    modal?: number;
    overlay?: number;
    menu?: number;
    tooltip?: number;
}

/**
 * Cratis-owned configuration accepted by {@link CratisComponentsProvider}.
 *
 * The named fields are Cratis-owned and no third-party type leaks through this
 * contract. Renderer-shaped values (`pt`, `theme`, `defaults`, and similar) are
 * accepted as `unknown` for source compatibility and interpreted by the active
 * adapter. Additional options belong under {@link adapter}; named fields win.
 */
export interface CratisComponentsConfig {
    csp?: { nonce?: string };
    defaults?: unknown;
    filterMatchModeOptions?: unknown;
    inputVariant?: 'outlined' | 'filled';
    locale?: string;
    locales?: unknown;
    pt?: unknown;
    ptOptions?: unknown;
    ripple?: boolean;
    theme?: unknown;
    stylesheet?: unknown;
    unstyled?: boolean;
    zIndex?: CratisZIndexConfig;
    /** PrimeUI key consumed by the current PrimeReact rendering adapter. */
    license?: string;
    /** Additional low-level options for the active rendering adapter. */
    adapter?: object;
}

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
export const mergeCratisComponentsConfig = (
    value: CratisComponentsConfig | undefined,
): CratisComponentsConfig => merge(cratisDefaults, value ?? {}) as CratisComponentsConfig;

const toPrimeReactProps = (config: CratisComponentsConfig): PrimeReactProps => {
    const { adapter, ...named } = config;

    // SAFETY: This is the single adapter boundary: named Cratis fields are mapped to
    // PrimeReact keys, while trusted application adapter values supply additional keys.
    return { ...adapter, ...named } as PrimeReactProps;
};

/**
 * Single setup point for Cratis Components. Wraps PrimeReact 11's
 * {@link PrimeReactProvider} so the library can layer Cratis-wide defaults on top of
 * PrimeReact's pass-through and unstyled mechanisms while still letting the consumer
 * take complete control. PrimeReact 11 is unstyled-first, so this library ships no
 * bundled theme — you choose the styling posture:
 *
 * Every option is passed through the single `value` prop (it is deep-merged onto
 * PrimeReact's provider config):
 *
 * - **Unstyled (default posture):** pass nothing, or `value={{ unstyled: true }}`, and
 *   style the structural markup yourself through the `--cratis-*` token layer, your own
 *   CSS, Tailwind, or `pt` definitions.
 * - **Styled:** spread `styledMode()` from `@cratis/components/styled` into `value` -
 *   PrimeReact's own component styles for every primitive plus a `@primeuix/themes`
 *   preset (the Cratis preset by default, `styledMode({ preset: Aura })` for another).
 *   A preset on `theme` alone only emits design tokens; the primitives render without
 *   `p-*` classes until `defaults` gives them their styles, which is what `styledMode()` does.
 * - Pass `value={{ pt, ptOptions }}` to apply global per-component pass-through.
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
export const CratisComponentsProvider = ({
    value,
    toaster,
    children,
}: CratisComponentsProviderProps) => {
    const merged = useMemo<PrimeReactProps>(
        () => toPrimeReactProps(mergeCratisComponentsConfig(value)),
        [value],
    );

    return (
        <PrimeReactProvider {...merged}>
            {children}
            {toaster && <Toaster {...(typeof toaster === 'object' ? toaster : {})} />}
        </PrimeReactProvider>
    );
};
