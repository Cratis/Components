// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * What a registered editor receives. The value is the host's own configuration for the component;
 * the editor reads it and proposes a replacement through {@link onChange}.
 */
export interface ConfigurationEditorRenderProps<TValue = unknown, TContext = unknown> {
    /** The host-defined component type the editor was looked up by. */
    componentType: string;

    /** The component's current configuration. */
    value: TValue;

    /**
     * Proposes a new configuration. The editor is controlled: the host applies the proposal by passing
     * a new `value`, or ignores it to cancel. The host still owns permission checks and persistence.
     */
    onChange: (proposal: TValue) => void;

    /** Whether the person may change the configuration. */
    readOnly: boolean;

    /** Host-defined data the editor needs, such as capabilities, destinations or an icon catalog. Passed through untouched. */
    context?: TContext;
}
