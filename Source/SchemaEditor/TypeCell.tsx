// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Dropdown } from '../Dropdown/Dropdown';
import { TypeFormat } from '../types/TypeFormat';
import { JsonSchemaProperty } from '../types/JsonSchema';
import type { SchemaEditorLabels } from './SchemaEditor';
import { buildTypeOptions } from './typeOptions';
import { resolveTypeChange } from './resolveTypeChange';
import { ReadOnlyContainerType } from './ReadOnlyTypeCell';
import { TypeCellActions } from './TypeCellActions';

export interface TypeCellProps {
    rowData: JsonSchemaProperty;
    isEditMode: boolean;
    typeFormats: TypeFormat[];
    onUpdateProperty: (
        oldName: string,
        field: keyof JsonSchemaProperty,
        value: unknown,
        additionalUpdates?: Partial<JsonSchemaProperty>,
    ) => void;
    onUpdateArrayItemType: (propertyName: string, itemType: string) => void;
    onNavigateToProperty: (propertyName: string) => void;
    onNavigateToArrayItems: (propertyName: string) => void;
    onRemoveProperty: (propertyName: string) => void;
    /** When false the remove button is not offered (a protected property). Defaults to `true`. */
    canRemove?: boolean;
    /** Resolved (merged with defaults) SchemaEditor labels for the cell's buttons. */
    labels: SchemaEditorLabels;
}

export const TypeCell = ({
    rowData,
    isEditMode,
    typeFormats,
    onUpdateProperty,
    onUpdateArrayItemType,
    onNavigateToProperty,
    onNavigateToArrayItems,
    onRemoveProperty,
    canRemove = true,
    labels,
}: TypeCellProps) => {
    const allTypeOptions = buildTypeOptions(typeFormats);
    const currentValue = rowData.format || rowData.type || 'string';

    const handleTypeChange = (value: string, propertyName: string, isArrayItem: boolean = false) => {
        const change = resolveTypeChange(value, typeFormats, isArrayItem);
        if (change.kind === 'arrayItem') {
            onUpdateArrayItemType(propertyName, change.type);
        } else {
            onUpdateProperty(propertyName, 'type', change.type, { format: change.format });
        }
    };

    if (!isEditMode) {
        if (rowData.type === 'array' || rowData.type === 'object') {
            return <ReadOnlyContainerType rowData={rowData} />;
        }
        return currentValue;
    }

    return (
        <div className='cratis:flex cratis:items-center cratis:gap-2 cratis:w-full' style={{ minHeight: '2.5rem' }}>
            <Dropdown<string>
                aria-label={labels.propertyType}
                value={currentValue}
                options={allTypeOptions}
                optionLabel='label'
                optionValue='value'
                onChange={(value) => handleTypeChange(value, rowData.name || '')}
                className='cratis:flex-1'
            />
            {rowData.type === 'array' && rowData.items && (
                <>
                    <span
                        style={{
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        of
                    </span>
                    <Dropdown<string>
                        aria-label={labels.arrayItemType}
                        value={rowData.items.type || 'string'}
                        options={allTypeOptions}
                        optionLabel='label'
                        optionValue='value'
                        onChange={(value) => handleTypeChange(value, rowData.name || '', true)}
                        className='cratis:flex-1'
                    />
                </>
            )}
            <TypeCellActions
                rowData={rowData}
                canRemove={canRemove}
                labels={labels}
                onNavigateToProperty={onNavigateToProperty}
                onNavigateToArrayItems={onNavigateToArrayItems}
                onRemoveProperty={onRemoveProperty}
            />
        </div>
    );
};
