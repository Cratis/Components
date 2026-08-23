// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as faIcons from 'react-icons/fa6';
import { Tooltip } from '../Common/Tooltip';
import { JsonSchemaProperty } from '../types/JsonSchema';

export interface NameCellProps {
    rowData: JsonSchemaProperty;
    isEditMode: boolean;
    onUpdate: (oldName: string, field: keyof JsonSchemaProperty, value: unknown) => void;
    validationError?: string;
}

export const NameCell = ({
    rowData,
    isEditMode,
    onUpdate,
    validationError,
}: NameCellProps) => {
    if (!isEditMode) {
        const isNavigable =
            rowData.type === 'object' ||
            (rowData.type === 'array' && rowData.items?.type === 'object');
        const navigationTooltipText =
            rowData.type === 'object'
                ? 'Click to navigate to object properties'
                : 'Click to navigate to item definition';

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tooltip
                    content={isNavigable ? navigationTooltipText : undefined}
                    position='top'
                >
                    <span>{rowData.name}</span>
                </Tooltip>
                {rowData.description && (
                    <Tooltip content={rowData.description} position='right'>
                        <faIcons.FaCircleInfo
                            style={{
                                color: 'var(--cratis-text-color-secondary)',
                                fontSize: '0.875rem',
                            }}
                        />
                    </Tooltip>
                )}
            </div>
        );
    }

    return (
        <Tooltip content={validationError} position='top' className='w-full'>
            <input
                value={rowData.name || ''}
                onChange={(event) =>
                    onUpdate(rowData.name || '', 'name', event.target.value)
                }
                className='cratis-field-input w-full'
                aria-invalid={Boolean(validationError) || undefined}
                data-invalid={Boolean(validationError) || undefined}
            />
        </Tooltip>
    );
};
