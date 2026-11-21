// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo, useCallback } from 'react';
import { ActionMenubar } from '../Common/ActionMenubar';
import { Message } from '../Display/Message';
import type { ReactNode } from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { JsonSchema } from '../types/JsonSchema';
import { type TypeFormat, DEFAULT_TYPE_FORMATS } from '../types/TypeFormat';
import { defaultSchemaEditorLabels } from './defaultSchemaEditorLabels';
import type { SchemaEditorLabels } from './SchemaEditorLabels';
import { findSchemaAtPath } from './schemaDocument';
import { useSchemaDocument } from './useSchemaDocument';
import { useSchemaEdits } from './useSchemaEdits';
import { useSchemaNavigation } from './useSchemaNavigation';
import { useSchemaRows } from './useSchemaRows';
import { useSchemaEditorMenu } from './schemaEditorMenu';
import { SchemaEditorNavigation } from './SchemaEditorNavigation';
import { SchemaEditorTable } from './SchemaEditorTable';

import type { SchemaEditorLayout } from './SchemaEditorLayout';
import type { Property } from './Tree/Property';
import { TreeSchemaEditor, type TreeSchemaEditorProps } from './Tree/TreeSchemaEditor';

export { defaultSchemaEditorLabels };
export type { SchemaEditorLabels };

/**
 * Properties of the tree layout the table layout has no counterpart for, including allowGeneratedProperty
 * and onSetGeneratedProperty. They are ignored when `layout` is `'table'`.
 */
type TreeOnlyProps = Omit<
    TreeSchemaEditorProps,
    | 'schema'
    | 'onChange'
    | 'labels'
    | 'className'
    | 'allowKeyProperty'
    | 'allowRequired'
    | 'readOnly'
    | 'isPropertyProtected'
    | 'validatePropertyName'
    | 'onPropertyRemoved'
    | 'onPropertyRenamed'
    | 'header'
    | 'footer'
>;

const emptySchema: JsonSchema = {};

/**
 * Props for {@link SchemaEditor}.
 */
export interface SchemaEditorProps extends TreeOnlyProps {
    /**
     * Which editor to render. `'table'` (the default) is the breadcrumb-navigated table with an Edit, Save and
     * Cancel workflow; `'tree'` is the inline tree editor that applies every edit live. See the layout notes in
     * the documentation for the props each layout honors.
     */
    layout?: SchemaEditorLayout;

    /**
     * The JSON Schema being viewed or edited. Required unless the tree layout is controlled through
     * `properties`.
     */
    schema?: JsonSchema;

    /** Optional event-type label displayed in the editor header. */
    eventTypeName?: string;

    /** When false, the Edit action remains visible but cannot enter edit mode; defaults to `true`. */
    canEdit?: boolean;

    /**
     * When {@link canEdit} is false, this string is shown as a tooltip on an
     * inert Edit action to explain why editing is unavailable.
     */
    canNotEditReason?: string;

    /** Invoked with the updated schema and optional metadata after any structural change. */
    onChange?: ChangeHandler<JsonSchema>;

    /** Invoked when the user activates the Save action. */
    onSave?: () => void;

    /** Invoked when the user activates the Cancel action. */
    onCancel?: () => void;

    /** Initial edit-mode state; defaults to `false` (read-only). */
    editMode?: boolean;

    /** When true, hides the Save menu item even while in edit mode. */
    saveDisabled?: boolean;

    /** When true, hides the Cancel menu item even while in edit mode. */
    cancelDisabled?: boolean;

    /**
     * Override the list of selectable type formats per JSON Schema type. Each
     * entry contributes options to the type-format dropdown shown in edit
     * mode. Defaults to {@link DEFAULT_TYPE_FORMATS}.
     */
    typeFormats?: TypeFormat[];

    /**
     * Extra CSS class names appended to the editor root. Combined with the
     * default `schema-editor` class. For fine-grained styling of internal
     * Components controls, use product tokens and stable Cratis parts.
     */
    className?: string;

    /** Override any user-facing string (for localization). See {@link SchemaEditorLabels}. */
    labels?: Partial<SchemaEditorLabels>;

    /**
     * Offers the key toggle (`x-key`, at most one property per object). In the table layout this adds a Key
     * column, editable in edit mode; a function enables the column for every row. In the tree layout it is
     * offered on every property, or per property when a function is given.
     */
    allowKeyProperty?: TreeSchemaEditorProps['allowKeyProperty'];

    /**
     * Offers the toggle for whether a property must be present (the `required` list). In the table layout this
     * adds a Required column, editable in edit mode.
     */
    allowRequired?: boolean;

    /** Offers no edits at all. Tree layout only: the table layout is read-only until Edit is chosen, controlled by `canEdit`. */
    readOnly?: boolean;

    /** Decides which properties can be neither renamed nor removed. By default none. Both layouts. */
    isPropertyProtected?: (property: Property) => boolean;

    /**
     * Extra check of a new name, after the editor has rejected blank, reserved and duplicate names. Return the
     * message to show, or `undefined` to accept the name. Both layouts.
     */
    validatePropertyName?: (name: string, property: Property, siblings: Property[]) => string | undefined;

    /** Called after a property was removed, with the property and everything nested under it. Both layouts. */
    onPropertyRemoved?: (property: Property) => void;

    /** Called after a property was renamed, with the renamed property and the name it had. Both layouts. */
    onPropertyRenamed?: (property: Property, previousName: string) => void;

    /** Content above the editor, for example the title of the schema. Both layouts. */
    header?: ReactNode;

    /** Content below the properties, for example further actions. Both layouts. */
    footer?: ReactNode;
}

/**
 * A breadcrumb-navigated editor for JSON Schemas. Lets users browse nested
 * `object` and `array` property definitions, add or remove properties, change
 * types and formats, and validate naming rules in place. Designed to drive
 * UIs around event payload schemas and similar structural documents.
 *
 * The editor composes a Cratis data table, action toolbar, and form widgets
 * internally. Restyle it through semantic tokens, the editor root `className`,
 * and documented `data-cratis-part` values rather than a provider preset.
 *
 * @param props - {@link SchemaEditorProps}.
 */
const TableSchemaEditor = ({
    schema: suppliedSchema,
    eventTypeName = '',
    canEdit = true,
    canNotEditReason,
    onChange,
    onSave,
    onCancel,
    editMode,
    saveDisabled = false,
    cancelDisabled = false,
    typeFormats = DEFAULT_TYPE_FORMATS,
    className,
    labels,
    allowKeyProperty,
    allowRequired,
    isPropertyProtected,
    validatePropertyName: validateCustomPropertyName,
    onPropertyRemoved,
    onPropertyRenamed,
    header,
    footer,
}: SchemaEditorProps) => {
    const l = useMemo(() => ({ ...defaultSchemaEditorLabels, ...labels }) as Required<SchemaEditorLabels>, [labels]);
    const document = useSchemaDocument({
        schema: suppliedSchema ?? emptySchema,
        editMode,
        onChange,
        onSave,
        onCancel,
    });
    const { currentSchema, schemaJsonIsInvalid, isEditMode } = document;
    const navigation = useSchemaNavigation(eventTypeName, isEditMode);
    const { currentPath } = navigation;
    const { properties, validationErrors } = useSchemaRows(
        currentSchema,
        currentPath,
        isEditMode,
        validateCustomPropertyName,
    );
    const markInvalid = useCallback(() => document.setSchemaJsonIsInvalid(true), [document.setSchemaJsonIsInvalid]);
    const edits = useSchemaEdits({
        currentSchema,
        currentPath,
        setCurrentSchema: document.setCurrentSchema,
        markInvalid,
        onChange,
        isPropertyProtected,
        onPropertyRemoved,
        onPropertyRenamed,
    });

    const hasValidationErrors = schemaJsonIsInvalid || Object.keys(validationErrors).length > 0;
    const menuItems = useSchemaEditorMenu({
        isEditMode,
        canEdit,
        canNotEditReason,
        schemaJsonIsInvalid,
        hasValidationErrors,
        saveDisabled,
        cancelDisabled,
        labels: l,
        onEdit: document.handleEdit,
        onSave: document.handleSave,
        onCancel: document.handleCancel,
        onAddProperty: edits.addProperty,
    });

    const currentLevel = findSchemaAtPath(currentSchema, currentPath);

    return (
        <div
            data-cratis-component='SchemaEditor'
            className={className ? `schema-editor ${className}` : 'schema-editor'}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
            {header}
            <div className='cratis:px-4 cratis:py-4'>
                <div className='schema-editor-menubar'>
                    <ActionMenubar aria-label={l.actions} model={menuItems} />
                </div>
                {schemaJsonIsInvalid && <Message severity='error' text={l.invalidJson} className='cratis:mt-3' />}
            </div>

            <SchemaEditorNavigation
                items={navigation.breadcrumbItems}
                description={currentLevel?.description}
                isAtRoot={currentPath.length === 0}
                navigateBackLabel={l.navigateBack}
                onNavigateBack={navigation.navigateBack}
                onNavigateToBreadcrumb={navigation.navigateToBreadcrumb}
            />

            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                <SchemaEditorTable
                    properties={properties}
                    currentPath={currentPath}
                    currentLevel={currentLevel}
                    isEditMode={isEditMode}
                    showRequired={allowRequired === true}
                    showKey={allowKeyProperty !== undefined && allowKeyProperty !== false}
                    validationErrors={validationErrors}
                    typeFormats={typeFormats}
                    labels={l}
                    actions={{
                        ...edits,
                        navigateToProperty: navigation.navigateToProperty,
                        navigateToArrayItems: navigation.navigateToArrayItems,
                    }}
                />
            </div>
            {footer}
        </div>
    );
};

/**
 * Edits the properties of a JSON Schema. By default (`layout='table'`) it is a breadcrumb-navigated table: it
 * lets users browse nested `object` and `array` property definitions, add or remove properties, change types and
 * formats, and validate naming rules in place, behind an Edit, Save and Cancel workflow. With `layout='tree'` it
 * is an inline tree that shows nested properties in place and applies every edit live. Designed to drive UIs
 * around event payload schemas and similar structural documents.
 *
 * Both layouts accept `allowRequired`, `allowKeyProperty`, `isPropertyProtected`, `validatePropertyName`,
 * `onPropertyRenamed`, `onPropertyRemoved`, `header` and `footer`. The tree layout also takes concepts, controlled
 * mode, per-row slots and selection; see the documentation for the exact split.
 *
 * The table layout composes a Cratis data table, action toolbar, and form widgets internally. Restyle it through
 * semantic tokens, the editor root `className`, and documented `data-cratis-part` values rather than a provider
 * preset.
 *
 * @param props - {@link SchemaEditorProps}.
 */
export const SchemaEditor = (props: SchemaEditorProps) =>
    props.layout === 'tree' ? <TreeSchemaEditor {...props} /> : <TableSchemaEditor {...props} />;
