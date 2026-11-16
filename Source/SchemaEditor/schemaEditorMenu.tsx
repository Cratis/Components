// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo } from 'react';
import * as faIcons from 'react-icons/fa6';
import type { ActionMenuItem } from '../Common/ActionMenubar';
import { Tooltip } from '../Common/Tooltip';
import type { SchemaEditorLabels } from './SchemaEditorLabels';

/** What the action menu needs to decide which items to offer and how they behave. */
export interface SchemaEditorMenuState {
    isEditMode: boolean;
    canEdit: boolean;
    canNotEditReason?: string;
    schemaJsonIsInvalid: boolean;
    hasValidationErrors: boolean;
    saveDisabled: boolean;
    cancelDisabled: boolean;
    labels: Required<SchemaEditorLabels>;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onAddProperty: () => void;
}

const inertEditStyle = {
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'not-allowed',
    opacity: 0.6,
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
} as const;

/** The Edit item shown when editing is unavailable, explaining why in a tooltip. */
const inertEditTemplate = (reason: string) => (item: ActionMenuItem) => (
    <Tooltip content={reason} position='bottom'>
        <button type='button' aria-disabled='true' style={inertEditStyle}>
            {item.icon}
            <span>{item.label}</span>
        </button>
    </Tooltip>
);

const editItem = (state: SchemaEditorMenuState): ActionMenuItem => ({
    label: state.labels.edit,
    icon: <faIcons.FaPencil className='cratis:mr-2' />,
    command: state.canEdit && !state.schemaJsonIsInvalid ? state.onEdit : undefined,
    disabled: state.schemaJsonIsInvalid,
    className: state.canEdit ? undefined : 'edit-disabled-with-reason',
    template: !state.canEdit && state.canNotEditReason ? inertEditTemplate(state.canNotEditReason) : undefined,
});

const saveItem = (state: SchemaEditorMenuState): ActionMenuItem => ({
    label: state.labels.save,
    icon: <faIcons.FaCheck className='cratis:mr-2' />,
    command: state.hasValidationErrors ? undefined : state.onSave,
    disabled: state.hasValidationErrors,
});

const cancelItem = (state: SchemaEditorMenuState): ActionMenuItem => ({
    label: state.labels.cancel,
    icon: <faIcons.FaXmark className='cratis:mr-2' />,
    command: state.onCancel,
});

const addPropertyItem = (state: SchemaEditorMenuState): ActionMenuItem => ({
    label: state.labels.addProperty,
    icon: <faIcons.FaPlus className='cratis:mr-2' />,
    command: state.schemaJsonIsInvalid ? undefined : state.onAddProperty,
    disabled: state.schemaJsonIsInvalid,
});

const editModeItems = (state: SchemaEditorMenuState): ActionMenuItem[] => [
    ...(state.saveDisabled ? [] : [saveItem(state)]),
    ...(state.cancelDisabled ? [] : [cancelItem(state)]),
    addPropertyItem(state),
];

/**
 * Builds the action menu of the table layout: Edit when viewing, Save, Cancel and Add property when editing.
 * @param state The editor state and handlers the items depend on.
 * @returns The menu items in display order.
 */
export const buildSchemaEditorMenu = (state: SchemaEditorMenuState): ActionMenuItem[] =>
    state.isEditMode ? editModeItems(state) : [editItem(state)];

/**
 * The memoized action menu of the table layout.
 * @param state The editor state and handlers the items depend on.
 * @returns The menu items in display order.
 */
export const useSchemaEditorMenu = (state: SchemaEditorMenuState): ActionMenuItem[] =>
    // The state object is rebuilt every render, so its fields are the memo dependencies.
    useMemo(() => buildSchemaEditorMenu(state), Object.values(state));
