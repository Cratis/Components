// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import * as faIcons from 'react-icons/fa6';
import { TypeFormat } from '../types/TypeFormat';
import { JsonSchemaProperty } from '../types/JsonSchema';

export interface TypeCellProps {
    rowData: JsonSchemaProperty;
    isEditMode: boolean;
    typeFormats: TypeFormat[];
    onUpdateProperty: (oldName: string, field: keyof JsonSchemaProperty, value: unknown, additionalUpdates?: Partial<JsonSchemaProperty>) => void;
    onUpdateArrayItemType: (propertyName: string, itemType: string) => void;
    onNavigateToProperty: (propertyName: string) => void;
    onNavigateToArrayItems: (propertyName: string) => void;
    onRemoveProperty: (propertyName: string) => void;
}

const CONTAINER_TYPES = [
    { label: 'array', value: 'array' },
    { label: 'object', value: 'object' }
];

export const TypeCell = ({
    rowData,
    isEditMode,
    typeFormats,
    onUpdateProperty,
    onUpdateArrayItemType,
    onNavigateToProperty,
    onNavigateToArrayItems,
    onRemoveProperty
}: TypeCellProps) => {
    const DEFAULT_TYPE_OPTIONS = [
        { label: 'string', value: 'string' },
        { label: 'integer', value: 'integer' },
        { label: 'number', value: 'number' },
        { label: 'boolean', value: 'boolean' }
    ];

    const formatOptions = typeFormats.length > 0
        ? typeFormats.map(tf => {
            const format = (!tf.format || tf.format === '' ? tf.jsonType : tf.format);
            return { label: format, value: format };
        })
        : DEFAULT_TYPE_OPTIONS;

    const allTypeOptions = [
        ...formatOptions,
        ...CONTAINER_TYPES
    ];

    const displayValue = rowData.format || rowData.type || 'string';
    const currentValue = rowData.format || rowData.type || 'string';

    const handleTypeChange = (value: string, propertyName: string, isArrayItem: boolean = false) => {
        if (value === 'array' || value === 'object') {
            if (isArrayItem) {
                onUpdateArrayItemType(propertyName, value);
            } else {
                onUpdateProperty(propertyName, 'type', value, { format: undefined });
            }
        } else {
            const typeFormat = typeFormats.find(tf => {
                const effectiveFormat = (!tf.format || tf.format === '' ? tf.jsonType : tf.format);
                return effectiveFormat === value;
            });

            if (typeFormat) {
                if (isArrayItem) {
                    onUpdateArrayItemType(propertyName, typeFormat.jsonType);
                } else {
                    if (typeFormat.format && typeFormat.format !== '') {
                        onUpdateProperty(propertyName, 'type', typeFormat.jsonType, { format: value });
                    } else {
                        onUpdateProperty(propertyName, 'type', typeFormat.jsonType, { format: undefined });
                    }
                }
            } else {
                if (isArrayItem) {
                    onUpdateArrayItemType(propertyName, value);
                } else {
                    onUpdateProperty(propertyName, 'type', value, { format: undefined });
                }
            }
        }
    };

    if (!isEditMode) {
        if (rowData.type === 'array') {
            const itemType = rowData.items?.type || 'string';
            const isNavigable = itemType === 'object';
            return (
                <div
                    className="flex align-items-center gap-2 w-full"
                    style={{ height: '100%' }}
                    data-pr-tooltip={isNavigable ? 'Click to navigate to item definition' : undefined}
                    data-pr-position="top"
                >
                    <span>Array of {itemType}</span>
                    {isNavigable && (
                        <>
                            <div style={{ flex: 1 }} />
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                <faIcons.FaArrowRight style={{ fontSize: '1rem', color: 'var(--primary-color)' }} />
                            </span>
                        </>
                    )}
                </div>
            );
        } else if (rowData.type === 'object') {
            return (
                <div
                    className="flex align-items-center gap-2 w-full"
                    style={{ height: '100%' }}
                    data-pr-tooltip="Click to navigate to object properties"
                    data-pr-position="top"
                >
                    <span>Object</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                        <faIcons.FaArrowRight style={{ fontSize: '1rem', color: 'var(--primary-color)' }} />
                    </span>
                </div>
            );
        }
        return displayValue;
    }

    return (
        <div className="flex align-items-center gap-2 w-full" style={{ minHeight: '2.5rem' }}>
            <Dropdown
                value={currentValue}
                options={allTypeOptions}
                onChange={(e) => handleTypeChange(e.value, rowData.name || '')}
                className="flex-1"
            />
            {rowData.type === 'array' && rowData.items && (
                <>
                    <span style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>of</span>
                    <Dropdown
                        value={rowData.items.type || 'string'}
                        options={allTypeOptions}
                        onChange={(e) => handleTypeChange(e.value, rowData.name || '', true)}
                        className="flex-1"
                    />
                </>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {rowData.type === 'array' && rowData.items?.type === 'object' && rowData.name && (
                    <Button
                        icon={<faIcons.FaArrowRight />}
                        className="p-button-text p-button-sm"
                        onClick={() => onNavigateToArrayItems(rowData.name!)}
                        tooltip="Navigate to item definition"
                        tooltipOptions={{ position: 'top' }}
                    />
                )}
                {rowData.type === 'object' && rowData.name && (
                    <Button
                        icon={<faIcons.FaArrowRight />}
                        className="p-button-text p-button-sm"
                        onClick={() => onNavigateToProperty(rowData.name!)}
                        tooltip="Navigate to object properties"
                        tooltipOptions={{ position: 'top' }}
                    />
                )}
                {rowData.name && (
                    <Button
                        icon={<faIcons.FaTrash />}
                        className="p-button-text p-button-danger p-button-sm"
                        onClick={() => onRemoveProperty(rowData.name!)}
                        tooltip="Delete property"
                        tooltipOptions={{ position: 'top' }}
                    />
                )}
            </div>
        </div>
    );
};
