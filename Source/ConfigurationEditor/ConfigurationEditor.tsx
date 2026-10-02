// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { useConfigurationEditor } from './ConfigurationEditorProvider';
import type { ConfigurationEditorRenderProps } from './ConfigurationEditorRenderProps';

/** Props for the {@link ConfigurationEditor} component. */
export interface ConfigurationEditorProps<TValue = unknown, TContext = unknown> {
    /** The host-defined type of the component being configured. Looked up in the nearest {@link ConfigurationEditorProvider}. */
    componentType: string;

    /** The component's current configuration. */
    value: TValue;

    /** Receives a proposed configuration. Apply it by passing a new `value`; ignore it to cancel. */
    onChange: (proposal: TValue) => void;

    /** Whether the person may change the configuration. */
    readOnly?: boolean;

    /** Host-defined data passed untouched to the registered editor and to the fallback. */
    context?: TContext;

    /**
     * What to show when no editor is registered for the component type, typically generic
     * {@link PropertyControls}. Without a fallback nothing is rendered.
     */
    fallback?: ReactNode | ((props: ConfigurationEditorRenderProps<TValue, TContext>) => ReactNode);
}

/**
 * Shows the configuration editor registered for a component type, or the generic fallback. Which
 * component types exist, what an edit means, and which template policy applies are all the host's;
 * this component only chooses the editor.
 */
export const ConfigurationEditor = <TValue, TContext = unknown>({
    componentType,
    value,
    onChange,
    readOnly = false,
    context,
    fallback,
}: ConfigurationEditorProps<TValue, TContext>) => {
    const editor = useConfigurationEditor<TValue, TContext>(componentType);
    const props: ConfigurationEditorRenderProps<TValue, TContext> = { componentType, value, onChange, readOnly, context };

    if (editor) return <>{editor(props)}</>;
    return <>{typeof fallback === 'function' ? fallback(props) : fallback}</>;
};
