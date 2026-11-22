// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import * as faIcons from 'react-icons/fa6';
import { Tooltip } from '../Common/Tooltip';
import type { Json, JsonSchemaProperty } from '../types/JsonSchema';
import { renderArrayTable } from './arrayTable';
import { infoIconStyle, labelStyle, rowStyle, tableStyle, valueStyle } from './styles';
import { renderValue } from './value';

interface TableProps {
    currentData: Json;
    currentProperties: Record<string, JsonSchemaProperty>;
    navigationPath: string[];
    editMode: boolean;
    renderEditField: (propertyName: string, property: JsonSchemaProperty, value: Json) => ReactNode;
    navigateTo: (segments: string[]) => void;
}

function schemaProperty(definition: JsonSchemaProperty | Json, atRoot: boolean) {
    return atRoot && typeof definition === 'object' && definition !== null && 'type' in definition
        ? definition as JsonSchemaProperty
        : null;
}

function renderPropertyLabel(propertyName: string, description: string | undefined) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {propertyName}
            {description && (
                <Tooltip content={description} position='right'>
                    <button
                        type='button'
                        aria-label='Property description'
                        style={{
                            display: 'inline-flex',
                            padding: 0,
                            border: 0,
                            background: 'transparent',
                            color: 'inherit',
                        }}
                    >
                        <faIcons.FaCircleInfo
                            aria-hidden='true'
                            className='property-info-icon'
                            style={infoIconStyle}
                        />
                    </button>
                </Tooltip>
            )}
        </span>
    );
}

function renderPropertyRow(propertyName: string, propertyDef: JsonSchemaProperty | Json, props: TableProps) {
    const { currentData, navigationPath, editMode, renderEditField, navigateTo } = props;
    const value = (currentData as Record<string, Json>)[propertyName];
    const property = schemaProperty(propertyDef, navigationPath.length === 0);
    const description = property?.description;
    return (
        <tr key={propertyName} style={rowStyle}>
            <td style={labelStyle}>
                {renderPropertyLabel(propertyName, description)}
            </td>
            <td style={valueStyle}>
                {editMode && property
                    ? renderEditField(propertyName, property, value)
                    : renderValue(value as Json, propertyName, [propertyName], navigateTo)}
            </td>
        </tr>
    );
}

export function renderTable(props: TableProps) {
    const { currentData, currentProperties, navigationPath, navigateTo } = props;
    if (currentData === null) {
        return null;
    }
    if (Array.isArray(currentData)) {
        return renderArrayTable(currentData, navigateTo);
    }
    const entries = navigationPath.length === 0
        ? Object.entries(currentProperties)
        : Object.entries(currentData as { [key: string]: Json });
    return (
        <table style={tableStyle}>
            <tbody>
                {entries.map(([propertyName, propertyDef]) => renderPropertyRow(propertyName, propertyDef, props))}
            </tbody>
        </table>
    );
}
