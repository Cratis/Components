// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ConfigurationEditorRenderer } from './ConfigurationEditorRenderer';

/** The editors available to a subtree, by host-defined component type. */
export type ConfigurationEditorMap = Readonly<Record<string, ConfigurationEditorRenderer<never, never>>>;

const ConfigurationEditorContext = createContext<ConfigurationEditorMap>({});

/** Props for the {@link ConfigurationEditorProvider} component. */
export interface ConfigurationEditorProviderProps {
    /**
     * The specialised editors the host registers, keyed by its own component type names. A nested
     * provider adds to and overrides its parent's editors.
     */
    editors: ConfigurationEditorMap;

    /** The subtree that can look the editors up. */
    children?: ReactNode;
}

/**
 * Makes component-specific configuration editors available to a subtree. This is the extension
 * seam: a component brings its own editor, the host registers it under the type name it already
 * uses, and {@link ConfigurationEditor} falls back to generic controls for everything else.
 */
export const ConfigurationEditorProvider = ({ editors, children }: ConfigurationEditorProviderProps) => {
    const parent = useContext(ConfigurationEditorContext);
    const merged = useMemo(() => ({ ...parent, ...editors }), [parent, editors]);
    return <ConfigurationEditorContext.Provider value={merged}>{children}</ConfigurationEditorContext.Provider>;
};

/**
 * Looks up the editor registered for a component type.
 *
 * @param componentType The host-defined component type.
 * @returns The registered editor, or `undefined` when none is registered.
 */
export const useConfigurationEditor = <TValue, TContext = unknown>(
    componentType: string,
): ConfigurationEditorRenderer<TValue, TContext> | undefined => {
    const editors = useContext(ConfigurationEditorContext);
    return editors[componentType] as unknown as ConfigurationEditorRenderer<TValue, TContext> | undefined;
};
