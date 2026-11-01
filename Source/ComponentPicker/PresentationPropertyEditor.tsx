// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { previewPresentationChanges } from '../configuration/identity/componentInstances';
import type { PresentationChange } from '../configuration/identity/PresentationChange';
import type { PresentationPropertyValue } from '../configuration/identity/PresentationPropertyValue';
import type { PickedComponent } from './PickedComponent';
import type { PickedPresentationProperty } from './PickedPresentationProperty';
import { proposedChanges } from './proposedChanges';

/** Props for {@link PresentationPropertyEditor}. */
export interface PresentationPropertyEditorProps {
    /** The picked component whose presentation properties are edited. */
    picked: PickedComponent;
    /** Called every time the proposed changes change, including with `[]` when nothing differs. Nothing is applied. */
    onChange: (changes: PresentationChange[]) => void;
    /**
     * Applies the proposed changes to the rendered component while editing, through the same
     * registry the picker reads. The component returns to how it was when the editor unmounts,
     * when this turns off, and when a change is edited back to its original value.
     */
    preview?: boolean;
    /** Extra class name for the editor root. */
    className?: string;
}

const unsetValue = '';

const field = (
    property: PickedPresentationProperty,
    id: string,
    value: PresentationPropertyValue,
    set: (next: PresentationPropertyValue) => void,
) => {
    const common = { id, disabled: !property.editable, 'data-cratis-part': 'input' } as const;
    switch (property.type) {
        case 'boolean':
            return (
                <input
                    {...common}
                    type='checkbox'
                    checked={value === true}
                    onChange={(event) => set(event.currentTarget.checked)}
                />
            );
        case 'number':
            return (
                <input
                    {...common}
                    className='cratis-text-input'
                    type='number'
                    value={typeof value === 'number' ? value : ''}
                    onChange={(event) =>
                        set(event.currentTarget.value === '' ? undefined : Number(event.currentTarget.value))
                    }
                />
            );
        case 'enum':
            return (
                <select
                    {...common}
                    className='cratis-text-input'
                    value={value === undefined ? unsetValue : String(value)}
                    onChange={(event) => {
                        const chosen = event.currentTarget.value;
                        set(chosen === unsetValue ? undefined : property.values?.find((v) => String(v) === chosen));
                    }}
                >
                    <option value={unsetValue}>
                        {property.defaultValue === undefined ? '(not set)' : `(default: ${String(property.defaultValue)})`}
                    </option>
                    {property.values?.map((option) => (
                        <option key={String(option)} value={String(option)}>
                            {String(option)}
                        </option>
                    ))}
                </select>
            );
        default:
            return (
                <input
                    {...common}
                    className='cratis-text-input'
                    type='text'
                    value={typeof value === 'string' ? value : ''}
                    onChange={(event) => set(event.currentTarget.value)}
                />
            );
    }
};

/**
 * A form for the presentation properties of a {@link PickedComponent}: a text, toggle, select or
 * number input per property, built from the component's descriptor. It reports the proposed changes
 * as `{ property, from, to }` and never applies them to the app, except for the optional live
 * `preview`.
 */
export const PresentationPropertyEditor = ({ picked, onChange, preview = false, className }: PresentationPropertyEditorProps) => {
    const prefix = useId();
    const [draft, setDraft] = useState<Record<string, PresentationPropertyValue>>({});
    const changes = useMemo(() => proposedChanges(picked, draft), [picked, draft]);
    const reportChange = useRef(onChange);
    reportChange.current = onChange;

    useEffect(() => {
        setDraft({});
    }, [picked]);

    useEffect(() => {
        reportChange.current(changes);
    }, [changes]);

    useEffect(() => {
        if (!preview || changes.length === 0) return;
        return previewPresentationChanges(picked.element, changes);
    }, [preview, changes, picked.element]);

    if (picked.presentationProperties.length === 0) {
        return (
            <p data-cratis-part='empty' className={className}>
                {picked.component} has no properties that can be changed here.
            </p>
        );
    }

    return (
        <div data-cratis-part='root' data-cratis-picker-editor='true' className={className}>
            {picked.presentationProperties.map((property) => {
                const id = `${prefix}-${property.name}`;
                const value = property.name in draft ? draft[property.name] : property.value;
                return (
                    <div key={property.name} data-cratis-part='property'>
                        <label htmlFor={id} data-cratis-part='label'>
                            {property.label}
                        </label>
                        {field(property, id, value, (next) =>
                            setDraft((current) => ({ ...current, [property.name]: next })),
                        )}
                        {property.description && <small data-cratis-part='description'>{property.description}</small>}
                    </div>
                );
            })}
        </div>
    );
};
