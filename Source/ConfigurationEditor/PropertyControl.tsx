// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useId, useState } from 'react';
import type { PropertyControlsLabels } from './PropertyControlsLabels';
import type { PropertyControlsParts } from './PropertyControlsParts';
import type { PropertyDescriptor } from './PropertyDescriptor';

/** Props of the internal control that renders one property. */
export interface PropertyControlProps {
    descriptor: PropertyDescriptor;
    value: unknown;
    readOnly: boolean;
    message: string | undefined;
    labels: Required<PropertyControlsLabels>;
    parts: PropertyControlsParts | undefined;
    /** Reports a value the person entered. Returns a message when the entry is not acceptable. */
    onChange: (name: string, value: unknown) => string | undefined;
}

const join = (...names: Array<string | undefined>) => names.filter(Boolean).join(' ');

const display = (descriptor: PropertyDescriptor, value: unknown, labels: Required<PropertyControlsLabels>): string => {
    if (value === undefined || value === null || value === '') return labels.unset;
    if (descriptor.kind === 'boolean') return value === true ? labels.on : labels.off;
    if (descriptor.kind === 'choice') return descriptor.options.find((option) => option.value === value)?.label ?? String(value);
    if (descriptor.kind === 'number' && descriptor.unit) return `${String(value)} ${descriptor.unit}`;
    return String(value);
};

const parseNumber = (
    text: string,
    descriptor: Extract<PropertyDescriptor, { kind: 'number' }>,
    labels: Required<PropertyControlsLabels>,
): { value: number | undefined } | { message: string } => {
    if (text.trim().length === 0) return descriptor.required ? { message: labels.required } : { value: undefined };
    const parsed = Number(text);
    if (!Number.isFinite(parsed)) return { message: labels.notANumber };
    if (descriptor.min !== undefined && parsed < descriptor.min) return { message: labels.belowMinimum(descriptor.min) };
    if (descriptor.max !== undefined && parsed > descriptor.max) return { message: labels.aboveMaximum(descriptor.max) };
    return { value: parsed };
};

/** One labeled property control: text, number, on/off or choice, or its value as text when it cannot change. */
export const PropertyControl = ({ descriptor, value, readOnly, message, labels, parts, onChange }: PropertyControlProps) => {
    const identity = useId();
    const controlId = `${identity}-control`;
    const messageId = `${identity}-message`;
    const [draft, setDraft] = useState<string | null>(null);
    const [entryMessage, setEntryMessage] = useState<string | undefined>(undefined);
    const locked = readOnly || descriptor.editable === false;
    const shownMessage = entryMessage ?? message;
    const note = locked ? descriptor.unavailableReason : descriptor.description;
    const noteId = `${identity}-note`;
    const describedBy = [shownMessage ? messageId : undefined, note ? noteId : undefined].filter(Boolean).join(' ') || undefined;

    useEffect(() => {
        setDraft(null);
    }, [value]);

    const commit = (next: unknown) => {
        setEntryMessage(onChange(descriptor.name, next));
    };

    const leave = () => {
        setDraft(null);
        setEntryMessage(undefined);
    };

    let control;
    if (locked) {
        control = (
            <span {...parts?.value} className={join('cratis-property__value', parts?.value?.className)} data-cratis-part='value'>
                {display(descriptor, value, labels)}
            </span>
        );
    } else if (descriptor.kind === 'boolean') {
        control = (
            <input
                {...parts?.input}
                id={controlId}
                type='checkbox'
                checked={value === true}
                aria-describedby={describedBy}
                onChange={(event) => commit(event.target.checked)}
                className={join('cratis-property__input', parts?.input?.className)}
                data-cratis-part='input'
            />
        );
    } else if (descriptor.kind === 'choice') {
        const known = descriptor.options.some((option) => option.value === value);
        control = (
            <select
                {...parts?.select}
                id={controlId}
                value={typeof value === 'string' ? value : ''}
                aria-invalid={shownMessage ? true : undefined}
                aria-describedby={describedBy}
                onChange={(event) => commit(event.target.value === '' ? undefined : event.target.value)}
                className={join('cratis-property__input', parts?.select?.className)}
                data-cratis-part='select'
                data-invalid={shownMessage ? true : undefined}
            >
                <option value=''>{labels.unset}</option>
                {typeof value === 'string' && value !== '' && !known && <option value={value}>{value}</option>}
                {descriptor.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        );
    } else if (descriptor.kind === 'number') {
        control = (
            <input
                {...parts?.input}
                id={controlId}
                type='number'
                inputMode='decimal'
                min={descriptor.min}
                max={descriptor.max}
                step={descriptor.step}
                value={draft ?? (typeof value === 'number' ? String(value) : '')}
                aria-invalid={shownMessage ? true : undefined}
                aria-describedby={describedBy}
                onChange={(event) => {
                    setDraft(event.target.value);
                    const parsed = parseNumber(event.target.value, descriptor, labels);
                    if ('message' in parsed) setEntryMessage(parsed.message);
                    else if (parsed.value !== value) commit(parsed.value);
                    else setEntryMessage(undefined);
                }}
                onBlur={leave}
                className={join('cratis-property__input', parts?.input?.className)}
                data-cratis-part='input'
                data-invalid={shownMessage ? true : undefined}
            />
        );
    } else {
        control = (
            <input
                {...parts?.input}
                id={controlId}
                type='text'
                placeholder={descriptor.placeholder}
                value={draft ?? (typeof value === 'string' ? value : '')}
                aria-invalid={shownMessage ? true : undefined}
                aria-describedby={describedBy}
                onChange={(event) => {
                    setDraft(event.target.value);
                    commit(event.target.value === '' ? undefined : event.target.value);
                }}
                onBlur={leave}
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && draft !== null) {
                        event.preventDefault();
                        event.stopPropagation();
                        leave();
                    }
                }}
                className={join('cratis-property__input', parts?.input?.className)}
                data-cratis-part='input'
                data-invalid={shownMessage ? true : undefined}
            />
        );
    }

    return (
        <div
            {...parts?.property}
            className={join('cratis-property', parts?.property?.className)}
            data-cratis-part='property'
            data-property={descriptor.name}
            data-kind={descriptor.kind}
            data-readonly={locked || undefined}
        >
            {locked ? (
                <span {...parts?.label} className={join('cratis-property__label', parts?.label?.className)} data-cratis-part='label'>
                    {descriptor.label}
                </span>
            ) : (
                <label {...parts?.label} htmlFor={controlId} className={join('cratis-property__label', parts?.label?.className)} data-cratis-part='label'>
                    {descriptor.label}
                </label>
            )}
            {control}
            {!locked && descriptor.kind === 'number' && descriptor.unit && (
                <span {...parts?.unit} className={join('cratis-property__unit', parts?.unit?.className)} data-cratis-part='unit'>
                    {descriptor.unit}
                </span>
            )}
            {shownMessage && (
                <p {...parts?.message} id={messageId} role='alert' className={join('cratis-property__message', parts?.message?.className)} data-cratis-part='message' data-invalid>
                    {shownMessage}
                </p>
            )}
            {note && (
                <p {...parts?.message} id={noteId} className={join('cratis-property__message cratis-property__message--note', parts?.message?.className)} data-cratis-part='message'>
                    {note}
                </p>
            )}
        </div>
    );
};
