// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Json, JsonSchemaProperty } from '../types/JsonSchema';
import type { ChangeMeta } from '../types/ChangeMeta';
import { DatePickerInput } from '../Common/DatePickerInput';
import { fieldErrorStyle } from './styles';

interface EditFieldProps {
    propertyName: string;
    property: JsonSchemaProperty;
    value: Json;
    error: string | undefined;
    handleChange: (newValue: Json, meta: ChangeMeta) => void;
}

function renderBooleanInput({ propertyName, value, error, handleChange }: EditFieldProps) {
    return (
        <input
            type='checkbox'
            aria-label={propertyName}
            checked={Boolean(value)}
            onChange={(event) =>
                handleChange(event.target.checked, {
                    source: 'user',
                    nativeEvent: event.nativeEvent,
                })
            }
            aria-invalid={Boolean(error) || undefined}
            className='cratis:size-5 cratis:accent-[var(--cratis-primary-color)]'
        />
    );
}

function renderNumberInput({ propertyName, value, error, handleChange }: EditFieldProps) {
    return (
        <input
            type='number'
            aria-label={propertyName}
            value={value === null || value === undefined ? '' : Number(value)}
            onChange={(event) =>
                handleChange(
                    event.target.value === '' ? null : event.target.valueAsNumber,
                    { source: 'user', nativeEvent: event.nativeEvent },
                )
            }
            aria-invalid={Boolean(error) || undefined}
            className='cratis-field-input cratis:w-full'
        />
    );
}

function renderDateInput({ propertyName, property, value, error, handleChange }: EditFieldProps) {
    const dateValue = value ? new Date(value as string) : null;
    const showTime = property.format === 'date-time';
    return (
        <DatePickerInput
            aria-label={propertyName}
            value={dateValue}
            onChange={(date, meta) =>
                handleChange(
                    date ? (showTime ? date.toISOString() : date.toISOString().split('T')[0]) : null,
                    meta ?? { source: 'user' },
                )
            }
            {...(showTime ? { showTime: true } : {})}
            showIcon
            invalid={!!error}
        />
    );
}

function renderLongTextInput({ propertyName, value, error, handleChange }: EditFieldProps) {
    return (
        <textarea
            aria-label={propertyName}
            value={String(value ?? '')}
            onChange={(event) =>
                handleChange(event.target.value, { source: 'user', nativeEvent: event.nativeEvent })
            }
            rows={3}
            aria-invalid={Boolean(error) || undefined}
            className='cratis-field-input cratis-field-textarea cratis:w-full'
        />
    );
}

function renderTextInput(props: EditFieldProps) {
    const { propertyName, property, value, error, handleChange } = props;
    if (property.type === 'string') {
        if (property.format === 'date-time' || property.format === 'date') {
            return renderDateInput(props);
        }
    }
    const isLongText = (value as string)?.length > 50;
    if (isLongText) {
        return renderLongTextInput(props);
    }
    return (
        <input
            aria-label={propertyName}
            value={String(value ?? '')}
            onChange={(event) =>
                handleChange(event.target.value, { source: 'user', nativeEvent: event.nativeEvent })
            }
            aria-invalid={Boolean(error) || undefined}
            className='cratis-field-input cratis:w-full'
        />
    );
}

function renderInput(props: EditFieldProps) {
    switch (props.property.type) {
        case 'boolean':
            return renderBooleanInput(props);
        case 'number':
        case 'integer':
            return renderNumberInput(props);
        default:
            return renderTextInput(props);
    }
}

export function renderEditField(props: EditFieldProps) {
    const { property, error } = props;
    if (property.type === 'array' || property.type === 'object') {
        return (
            <div
                className='cratis:flex cratis:items-center cratis:gap-2'
                style={{
                    color: 'var(--cratis-text-color-secondary)',
                    fontStyle: 'italic',
                }}
            >
                <span>{property.type === 'array' ? 'Array editing not yet supported' : 'Object editing not yet supported'}</span>
            </div>
        );
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {renderInput(props)}
            {error && <small style={fieldErrorStyle}>{error}</small>}
        </div>
    );
}
