// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Button } from '../Common/Button';
import { Tooltip } from '../Common/Tooltip';
import * as faIcons from 'react-icons/fa6';
import type { JsonSchemaProperty } from '../types/JsonSchema';
import type { SchemaEditorLabels } from './SchemaEditor';

export interface TypeCellActionsProps {
    rowData: JsonSchemaProperty;
    canRemove: boolean;
    labels: SchemaEditorLabels;
    onNavigateToProperty: (propertyName: string) => void;
    onNavigateToArrayItems: (propertyName: string) => void;
    onRemoveProperty: (propertyName: string) => void;
}

interface ActionButtonProps {
    label: string;
    icon: React.ReactNode;
    tone?: 'critical';
    onClick: () => void;
}

const ActionButton = ({ label, icon, tone, onClick }: ActionButtonProps) => (
    <Tooltip content={label} position='top'>
        <Button
            variant='ghost'
            tone={tone}
            size='small'
            icon={icon}
            onClick={onClick}
            aria-label={label}
        />
    </Tooltip>
);

const navigatesToArrayItems = (rowData: JsonSchemaProperty) =>
    rowData.type === 'array' && rowData.items?.type === 'object';

/** The navigate and delete buttons at the end of an editable type cell. */
export const TypeCellActions = ({
    rowData,
    canRemove,
    labels,
    onNavigateToProperty,
    onNavigateToArrayItems,
    onRemoveProperty,
}: TypeCellActionsProps) => {
    const name = rowData.name;
    return (
        <div
            style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
            }}
        >
            {name && navigatesToArrayItems(rowData) && (
                <ActionButton
                    label={labels.navigateToItemDefinition}
                    icon={<faIcons.FaArrowRight />}
                    onClick={() => onNavigateToArrayItems(name)}
                />
            )}
            {name && rowData.type === 'object' && (
                <ActionButton
                    label={labels.navigateToProperties}
                    icon={<faIcons.FaArrowRight />}
                    onClick={() => onNavigateToProperty(name)}
                />
            )}
            {name && canRemove && (
                <ActionButton
                    label={labels.deleteProperty}
                    icon={<faIcons.FaTrash />}
                    tone='critical'
                    onClick={() => onRemoveProperty(name)}
                />
            )}
        </div>
    );
};
