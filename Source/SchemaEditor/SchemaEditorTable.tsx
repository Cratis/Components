// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Checkbox } from '../Common/Checkbox';
import { DataTableCore } from '../DataTables/DataTableCore';
import { Column } from '../DataTables/Column';
import type { JsonSchema, JsonSchemaProperty } from '../types/JsonSchema';
import type { TypeFormat } from '../types/TypeFormat';
import { NameCell } from './NameCell';
import type { SchemaEditorLabels } from './SchemaEditorLabels';
import { TypeCell, type TypeCellProps } from './TypeCell';
import { KEY_KEYWORD } from './Tree/schemaConversion';

/** The edits the table's cells can request. */
export interface SchemaEditorTableActions {
    updateProperty: TypeCellProps['onUpdateProperty'];
    updateArrayItemType: TypeCellProps['onUpdateArrayItemType'];
    navigateToProperty: (propertyName: string) => void;
    navigateToArrayItems: (propertyName: string) => void;
    removeProperty: (propertyName: string) => void;
    setRequired: (propertyName: string, isRequired: boolean) => void;
    setKey: (propertyName: string) => void;
    isProtected: (propertyName: string) => boolean;
}

/** Props of the table layout's property table. */
export interface SchemaEditorTableProps {
    properties: JsonSchemaProperty[];
    currentPath: string[];
    currentLevel: JsonSchema | undefined;
    isEditMode: boolean;
    showRequired: boolean;
    showKey: boolean;
    validationErrors: Record<string, string>;
    typeFormats: TypeFormat[];
    labels: Required<SchemaEditorLabels>;
    actions: SchemaEditorTableActions;
}

const isKeyProperty = (level: JsonSchema | undefined, propertyName: string): boolean =>
    (level?.properties?.[propertyName] as Record<string, unknown> | undefined)?.[KEY_KEYWORD] === true;

const isNavigable = (row: JsonSchemaProperty) =>
    row.type === 'object' || (row.type === 'array' && row.items?.type === 'object');

const navigateRow = (row: JsonSchemaProperty, actions: SchemaEditorTableActions) => {
    if (!row.name) return;
    if (row.type === 'object') {
        actions.navigateToProperty(row.name);
    } else if (isNavigable(row)) {
        actions.navigateToArrayItems(row.name);
    }
};

const nameColumn = ({ isEditMode, validationErrors, labels, actions }: SchemaEditorTableProps) => (
    <Column
        field='name'
        header='Property'
        body={(rowData: JsonSchemaProperty) => (
            <NameCell
                rowData={rowData}
                isEditMode={isEditMode}
                onUpdate={actions.updateProperty}
                validationError={validationErrors[rowData.id!]}
                propertyNameLabel={labels.propertyName}
                isLocked={actions.isProtected(rowData.name ?? '')}
                lockedReason={labels.protectedProperty}
            />
        )}
        style={{ width: '30%' }}
    />
);

interface CheckboxColumnOptions {
    header: string;
    isEditMode: boolean;
    ariaLabel: (propertyName: string) => string;
    isChecked: (propertyName: string) => boolean;
    onChange: (propertyName: string, checked: boolean) => void;
}

const checkboxColumn = ({ header, isEditMode, ariaLabel, isChecked, onChange }: CheckboxColumnOptions) => (
    <Column
        header={header}
        body={(rowData: JsonSchemaProperty) => (
            <Checkbox
                aria-label={ariaLabel(rowData.name ?? '')}
                checked={isChecked(rowData.name ?? '')}
                readOnly={!isEditMode}
                onChange={(checked) => onChange(rowData.name ?? '', checked)}
            />
        )}
        style={{ width: '6rem' }}
    />
);

const requiredColumn = ({ isEditMode, currentLevel, labels, actions }: SchemaEditorTableProps) =>
    checkboxColumn({
        header: labels.requiredColumn,
        isEditMode,
        ariaLabel: labels.requiredProperty,
        isChecked: (name) => Boolean(currentLevel?.required?.includes(name)),
        onChange: actions.setRequired,
    });

const keyColumn = ({ isEditMode, currentLevel, labels, actions }: SchemaEditorTableProps) =>
    checkboxColumn({
        header: labels.keyColumn,
        isEditMode,
        ariaLabel: labels.keyProperty,
        isChecked: (name) => isKeyProperty(currentLevel, name),
        onChange: (name) => actions.setKey(name),
    });

const typeColumn = ({ isEditMode, typeFormats, labels, actions }: SchemaEditorTableProps) => (
    <Column
        header='Type'
        body={(rowData: JsonSchemaProperty) => (
            <TypeCell
                rowData={rowData}
                isEditMode={isEditMode}
                typeFormats={typeFormats}
                onUpdateProperty={actions.updateProperty}
                onUpdateArrayItemType={actions.updateArrayItemType}
                onNavigateToProperty={actions.navigateToProperty}
                onNavigateToArrayItems={actions.navigateToArrayItems}
                onRemoveProperty={actions.removeProperty}
                canRemove={!actions.isProtected(rowData.name ?? '')}
                labels={labels}
            />
        )}
        style={{ width: '70%' }}
    />
);

/** The table of the properties at the current schema level. */
export const SchemaEditorTable = (props: SchemaEditorTableProps) => {
    const { properties, currentPath, isEditMode, showRequired, showKey, labels, actions } = props;

    return (
        <DataTableCore<JsonSchemaProperty>
            key={`${isEditMode}-${currentPath.join('/')}`}
            data={properties}
            dataKey='id'
            emptyMessage={labels.emptyMessage}
            rowClassName={(rowData) => (!isEditMode && isNavigable(rowData) ? 'cratis-schema-editor-navigable-row' : '')}
            onRowClick={(e) => {
                if (!isEditMode) navigateRow(e.data, actions);
            }}
            pt={{
                root: { style: { border: 'none' } },
                body: {
                    style: {
                        borderTop: '1px solid var(--cratis-surface-border)',
                    },
                },
            }}
        >
            {nameColumn(props)}
            {showRequired && requiredColumn(props)}
            {showKey && keyColumn(props)}
            {typeColumn(props)}
        </DataTableCore>
    );
};
