// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, useMemo } from 'react';
import { PropertyControl } from './PropertyControl';
import type { PropertyChangeProposal } from './PropertyChangeProposal';
import type { PropertyControlsLabels } from './PropertyControlsLabels';
import type { PropertyControlsParts } from './PropertyControlsParts';
import type { PropertyDescriptor } from './PropertyDescriptor';
import type { PropertyGroup } from './PropertyGroup';
import { defaultPropertyControlsLabels } from './defaultPropertyControlsLabels';

/** Props for the {@link PropertyControls} component. */
export interface PropertyControlsProps {
    /** The controls, in titled groups. The host decides what exists; nothing here knows a component or a layout engine. */
    groups: ReadonlyArray<PropertyGroup>;

    /** The current values by property name. The controls are controlled and show exactly these. */
    values: Readonly<Record<string, unknown>>;

    /** Receives a validated, permitted change. Apply it by passing new `values`; ignore it to cancel. */
    onChange: (proposal: PropertyChangeProposal) => void;

    /** The host's rules, run on a value before it is proposed. A message blocks the proposal. */
    validate?: (name: string, value: unknown, values: Readonly<Record<string, unknown>>) => string | undefined;

    /** Validation feedback from the host by property name, for example from a server-side check. */
    messages?: Readonly<Record<string, string>>;

    /** Shows every value as text without letting any change. */
    readOnly?: boolean;

    /** Overrides for the controls' strings. Unset fields fall back to English. */
    labels?: PropertyControlsLabels;

    /** The controls' accessible name. */
    'aria-label'?: string;

    /** The id of the element naming the controls. */
    'aria-labelledby'?: string;

    /** Extra class name on the root. */
    className?: string;

    /** Pass-through attributes for the stable parts. */
    pt?: PropertyControlsParts;
}

const findDescriptor = (groups: ReadonlyArray<PropertyGroup>, name: string): PropertyDescriptor | undefined =>
    groups.flatMap((group) => group.properties).find((property) => property.name === name);

/**
 * Generic property controls driven by host descriptors: text, number, on/off and choice, in titled
 * groups. Use them for the flow, grid-placement or freeform-placement settings of a layout, for a
 * component's own settings, or as the fallback of a {@link ConfigurationEditor}.
 *
 * The controls hold no layout engine and no component registry. A property the host marks
 * `editable: false` is shown as text with the reason it is unavailable, and a change to it is never
 * proposed.
 */
export const PropertyControls = ({
    groups,
    values,
    onChange,
    validate,
    messages,
    readOnly = false,
    labels: suppliedLabels,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    className,
    pt,
}: PropertyControlsProps) => {
    const labels = useMemo(() => {
        const resolved: Record<string, unknown> = { ...defaultPropertyControlsLabels };
        for (const [key, value] of Object.entries(suppliedLabels ?? {})) if (value !== undefined) resolved[key] = value;
        return resolved as unknown as Required<PropertyControlsLabels>;
    }, [suppliedLabels]);
    const baseId = useId();

    const handleChange = (name: string, value: unknown): string | undefined => {
        if (readOnly) return undefined;
        const descriptor = findDescriptor(groups, name);
        if (!descriptor || descriptor.editable === false) return undefined;
        const previous = values[name];
        if (previous === value) return undefined;
        const message = validate?.(name, value, values);
        if (message) return message;
        const next: Record<string, unknown> = { ...values, [name]: value };
        if (value === undefined) delete next[name];
        onChange({ name, value, previous, values: next });
        return undefined;
    };

    return (
        <div
            {...pt?.root}
            role='group'
            aria-label={ariaLabelledBy ? undefined : ariaLabel}
            aria-labelledby={ariaLabelledBy}
            className={['cratis-property-controls', pt?.root?.className, className].filter(Boolean).join(' ')}
            data-cratis-part='root'
        >
            {groups.map((group) => {
                const titleId = `${baseId}-${group.id.replace(/[^A-Za-z0-9_-]/gu, '_')}`;
                return (
                    <section
                        key={group.id}
                        {...pt?.group}
                        aria-labelledby={titleId}
                        className={['cratis-property-controls__group', pt?.group?.className].filter(Boolean).join(' ')}
                        data-cratis-part='group'
                        data-group={group.id}
                    >
                        <h3 {...pt?.groupTitle} id={titleId} className={['cratis-property-controls__title', pt?.groupTitle?.className].filter(Boolean).join(' ')} data-cratis-part='groupTitle'>
                            {group.title}
                        </h3>
                        {group.description && (
                            <p {...pt?.groupDescription} className={['cratis-property-controls__description', pt?.groupDescription?.className].filter(Boolean).join(' ')} data-cratis-part='groupDescription'>
                                {group.description}
                            </p>
                        )}
                        {group.properties.map((descriptor) => (
                            <PropertyControl
                                key={descriptor.name}
                                descriptor={descriptor}
                                value={values[descriptor.name]}
                                readOnly={readOnly}
                                message={messages?.[descriptor.name]}
                                labels={labels}
                                parts={pt}
                                onChange={handleChange}
                            />
                        ))}
                    </section>
                );
            })}
        </div>
    );
};
