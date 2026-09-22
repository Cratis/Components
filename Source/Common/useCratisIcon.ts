// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, type ReactNode } from 'react';
import { useCratisComponentsConfig } from './CratisComponentsContext';
import type { CratisComponentsIcons } from './CratisComponentsProvider';

/**
 * Resolves one icon site.
 *
 * @param name Vocabulary name for the concept drawn at this site.
 * @param builtIn Glyph the library has always drawn here, used when nothing is registered.
 * @param override Value of the site's own icon prop, when the component has one.
 * @returns The node to render: the per-component prop when it was supplied, otherwise the registered
 * provider icon, otherwise the built-in glyph.
 */
export type CratisIconResolver = (
    name: keyof CratisComponentsIcons,
    builtIn: ReactNode,
    override?: ReactNode,
) => ReactNode;

/**
 * Reads the provider's icon vocabulary and returns the resolver Components uses at every icon site.
 *
 * Precedence is `per-component prop → provider icon → built-in glyph`. A prop names one call site
 * and therefore wins; the provider replaces the built-in default product-wide. Both an unset prop
 * and an unregistered name are `undefined`, so a registered `null` deliberately draws nothing rather
 * than falling back.
 */
export const useCratisIcon = (): CratisIconResolver => {
    const { icons } = useCratisComponentsConfig();
    return useCallback(
        (name, builtIn, override) => {
            if (override !== undefined) return override;
            const registered = icons?.[name];
            return registered !== undefined ? registered : builtIn;
        },
        [icons],
    );
};
