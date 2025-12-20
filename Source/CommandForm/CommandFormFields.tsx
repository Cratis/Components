// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import { useCommandFormContext } from './CommandForm';
import React from 'react';
import { Tooltip } from 'primereact/tooltip';

export interface ColumnInfo {
    fields: React.ReactElement[];
}

export interface CommandFormFieldsProps {
    fields?: React.ReactElement[];
    columns?: ColumnInfo[];
}

// Separate component for each field to prevent re-rendering all fields
const CommandFormFieldWrapper = ({ field, index }: { field: React.ReactElement; index: number }) => {
    const context = useCommandFormContext();
    const fieldProps = field.props as unknown;
    const propertyAccessor = fieldProps.value;

    // Get the property name from the accessor function
    const propertyName = propertyAccessor ? getPropertyName(propertyAccessor) : '';

    // Get the current value from the command instance
    const currentValue = propertyName ? (context.commandInstance as unknown)?.[propertyName] : undefined;

    // Get the error message for this field, if any
    const errorMessage = propertyName ? context.getFieldError(propertyName) : undefined;

    // Get the property descriptor for this field from the command instance
    const propertyDescriptor = propertyName && (context.commandInstance as unknown)?.propertyDescriptors
        ? (context.commandInstance as unknown).propertyDescriptors.find((pd: unknown) => pd.name === propertyName)
        : undefined;

    // Clone the field element with the current value and onChange handler
    const clonedField = React.cloneElement(field, {
        ...fieldProps,
        currentValue,
        propertyDescriptor,
        fieldName: propertyName,
        onValueChange: (value: unknown) => {
            if (propertyName) {
                const oldValue = currentValue;

                // Call custom field validator if provided
                if (context.onFieldValidate) {
                    const validationError = context.onFieldValidate(context.commandInstance, propertyName, oldValue, value);
                    context.setCustomFieldError(propertyName, validationError);
                }

                context.setCommandValues({ [propertyName]: value } as unknown);

                // Call field change callback if provided
                if (context.onFieldChange) {
                    context.onFieldChange(context.commandInstance, propertyName, oldValue, value);
                }
            }
            fieldProps.onChange?.(value);
        },
        required: fieldProps.required ?? true,
        invalid: !!errorMessage
    } as unknown);

    const tooltipId = fieldProps.description ? `tooltip-${propertyName}-${index}` : undefined;

    return (
        <div style={{ width: '100%' }}>
            <div className="p-inputgroup" style={{ width: '100%' }}>
                {fieldProps.description && (
                    <Tooltip target={`.${tooltipId}`} content={fieldProps.description} />
                )}
                {fieldProps.icon && (
                    <span className={`p-inputgroup-addon ${tooltipId || ''}`}>
                        {fieldProps.icon}
                    </span>
                )}
                {clonedField}
            </div>
            {errorMessage && (
                <small className="p-error block mt-1">{errorMessage}</small>
            )}
        </div>
    );
};

export const CommandFormFields = (props: CommandFormFieldsProps) => {
    const { fields, columns } = props;

    // Render columns if provided
    if (columns && columns.length > 0) {
        return (
            <div className="card flex flex-column md:flex-row gap-3">
                {columns.map((column, columnIndex) => (
                    <div key={`column-${columnIndex}`} className="flex flex-column gap-3 flex-1">
                        {column.fields.map((field, index) => {
                            const fieldProps = field.props as unknown;
                            const propertyAccessor = fieldProps.value;
                            const propertyName = propertyAccessor ? getPropertyName(propertyAccessor) : `field-${columnIndex}-${index}`;

                            return (
                                <CommandFormFieldWrapper
                                    key={propertyName}
                                    field={field}
                                    index={index}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    }

    // Render fields (single column layout)
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            {(fields || []).map((field, index) => {
                const fieldProps = field.props as unknown;
                const propertyAccessor = fieldProps.value;
                const propertyName = propertyAccessor ? getPropertyName(propertyAccessor) : `field-${index}`;

                return (
                    <CommandFormFieldWrapper
                        key={propertyName}
                        field={field}
                        index={index}
                    />
                );
            })}
        </div>
    );
};

// Helper function to extract property name from accessor function
function getPropertyName<T>(accessor: (obj: T) => unknown): string {
    const fnStr = accessor.toString();
    const match = fnStr.match(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    return match ? match[1] : '';
}
