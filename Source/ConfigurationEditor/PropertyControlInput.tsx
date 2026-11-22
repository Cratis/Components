// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { KeyboardEvent } from 'react';
import type { ChoicePropertyDescriptor, NumberPropertyDescriptor } from './PropertyDescriptor';
import type { PropertyControlState } from './usePropertyControl';
import { parsePropertyNumber, displayPropertyValue } from './propertyControlValue';

const join = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

const changeNumberDraft = (state: PropertyControlState, descriptor: NumberPropertyDescriptor, text: string) => {
    const { setDraft, setEntryMessage, value, commit, labels } = state;
    setDraft(text);
    const parsed = parsePropertyNumber(text, descriptor, labels);
    if ('message' in parsed) setEntryMessage(parsed.message);
    else if (parsed.value !== value) commit(parsed.value);
    else setEntryMessage(undefined);
};

const renderNumber = (state: PropertyControlState) => {
    const { descriptor, value, draft, parts, leave } = state;
    if (descriptor.kind !== 'number') return undefined;
    return (
        <input
            {...parts?.input}
            id={state.controlId}
            type='number'
            inputMode='decimal'
            min={descriptor.min}
            max={descriptor.max}
            step={descriptor.step}
            value={draft ?? (typeof value === 'number' ? String(value) : '')}
            aria-invalid={state.shownMessage ? true : undefined}
            aria-describedby={state.describedBy}
            onChange={(event) => changeNumberDraft(state, descriptor, event.target.value)}
            onBlur={leave}
            className={join('cratis-property__input', parts?.input?.className)}
            data-cratis-part='input'
            data-invalid={state.shownMessage ? true : undefined}
        />
    );
};

const renderChoiceOptions = (descriptor: ChoicePropertyDescriptor, value: unknown, known: boolean) => (
    <>
        {typeof value === 'string' && value !== '' && !known && <option value={value}>{value}</option>}
        {descriptor.options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
        ))}
    </>
);

const renderChoice = (state: PropertyControlState) => {
    const { descriptor, value, parts, commit, controlId, shownMessage, describedBy } = state;
    if (descriptor.kind !== 'choice') return undefined;
    const known = descriptor.options.some((option) => option.value === value);
    return (
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
            <option value=''>{state.labels.unset}</option>
            {renderChoiceOptions(descriptor, value, known)}
        </select>
    );
};

const renderBoolean = (state: PropertyControlState) => {
    const { parts, controlId, value, describedBy, commit } = state;
    return (
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
};

const handleTextKeyDown = (event: KeyboardEvent<HTMLInputElement>, state: PropertyControlState) => {
    if (event.key === 'Escape' && state.draft !== null) {
        event.preventDefault();
        event.stopPropagation();
        state.leave();
    }
};

const renderText = (state: PropertyControlState) => {
    const { descriptor, value, draft, setDraft, parts, commit, leave } = state;
    if (descriptor.kind !== 'text') return undefined;
    return (
        <input
            {...parts?.input}
            id={state.controlId}
            type='text'
            placeholder={descriptor.placeholder}
            value={draft ?? (typeof value === 'string' ? value : '')}
            aria-invalid={state.shownMessage ? true : undefined}
            aria-describedby={state.describedBy}
            onChange={(event) => {
                setDraft(event.target.value);
                commit(event.target.value === '' ? undefined : event.target.value);
            }}
            onBlur={leave}
            onKeyDown={(event) => handleTextKeyDown(event, state)}
            className={join('cratis-property__input', parts?.input?.className)}
            data-cratis-part='input'
            data-invalid={state.shownMessage ? true : undefined}
        />
    );
};

/** Renders the existing native control for the descriptor, or its locked value. */
export const renderPropertyInput = (state: PropertyControlState) => {
    const { locked, descriptor, value, labels, parts } = state;
    if (locked) {
        return (
            <span {...parts?.value} className={join('cratis-property__value', parts?.value?.className)} data-cratis-part='value'>
                {displayPropertyValue(descriptor, value, labels)}
            </span>
        );
    }
    switch (descriptor.kind) {
        case 'boolean': return renderBoolean(state);
        case 'choice': return renderChoice(state);
        case 'number': return renderNumber(state);
        default: return renderText(state);
    }
};

/** Keeps the native label association only for editable controls. */
export const renderPropertyLabel = ({ locked, parts, descriptor, controlId }: PropertyControlState) => locked ? (
    <span {...parts?.label} className={join('cratis-property__label', parts?.label?.className)} data-cratis-part='label'>
        {descriptor.label}
    </span>
) : (
    <label {...parts?.label} htmlFor={controlId} className={join('cratis-property__label', parts?.label?.className)} data-cratis-part='label'>
        {descriptor.label}
    </label>
);

/** Validation precedes the descriptive note in the property. */
export const renderPropertyMessages = ({ shownMessage, messageId, note, noteId, parts }: PropertyControlState) => (
    <>
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
    </>
);
