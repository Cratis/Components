// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { FaKey, FaLock, FaPlus, FaXmark } from 'react-icons/fa6';
import type { Property } from './Property';
import { PropertyNameProblem, findPropertyNameProblem } from './propertyNaming';
import { PropertyTypeBadge } from './PropertyTypeBadge';
import { PropertyTypeMenu } from './PropertyTypeMenu';
import { useSchemaEditorContext } from './SchemaEditorContext';
import type { SchemaPropertyContext } from './SchemaPropertyContext';
import { hasNestedProperties, propertyTypeName } from './propertyTypeDisplay';

/** Props for one row of the editor, and everything nested under it. */
export interface SchemaPropertyRowProps {
    /** The property shown. */
    property: Property;

    /** The properties that share its parent, including itself. */
    siblings: Property[];

    /** How deeply the property is nested. */
    depth: number;
}

const interactiveSelector = 'button, input, label, textarea, select, a, [role="menu"]';

/** One property: its row of controls, the host's details beneath it, and the properties nested under it. */
export const SchemaPropertyRow = ({ property, siblings, depth }: SchemaPropertyRowProps) => {
    const context = useSchemaEditorContext();
    const { labels, parts, operations, readOnly } = context;
    const messageId = useId();
    const nameInput = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(property.name);
    const [problem, setProblem] = useState<string | undefined>(undefined);

    const rowContext: SchemaPropertyContext = { depth, siblings, properties: context.properties, readOnly };
    const rowState = context.getRowState?.(property, rowContext);
    const details = context.renderDetails?.(property, rowContext);
    const isProtected = context.isProtected(property);
    const canRename = !readOnly && !isProtected && operations.rename !== undefined;
    const canRemove = !readOnly && !isProtected && operations.remove !== undefined;
    const canChangeType = !readOnly && operations.changeType !== undefined && rowState?.lockType !== true;
    const canSetRequired = context.isRequiredAllowed && operations.setRequired !== undefined;
    const canSetKey = !readOnly && operations.setKey !== undefined && context.isKeyAllowed(property, rowContext);
    const canAddChild = !readOnly && operations.addChild !== undefined && hasNestedProperties(property.type);
    const isSelected = context.selectedPropertyId === property.id;
    const typeName = propertyTypeName(property.type, labels);
    const nestedLabel = labels.nestedProperties(property.name);

    useEffect(() => {
        if (isEditing) nameInput.current?.select();
    }, [isEditing]);

    const startEditing = () => {
        if (!canRename) return;
        setDraftName(property.name);
        setProblem(undefined);
        setIsEditing(true);
    };

    const stopEditing = () => {
        setIsEditing(false);
        setProblem(undefined);
    };

    const describe = (name: string): string | undefined => {
        const found = findPropertyNameProblem(name, property.id, siblings);
        if (found === PropertyNameProblem.Empty) return labels.nameRequired;
        if (found === PropertyNameProblem.Reserved) return labels.nameReserved(name);
        if (found === PropertyNameProblem.Duplicate) return labels.nameDuplicate(name);
        return context.validateName?.(name, property, siblings);
    };

    const commit = (): boolean => {
        const name = draftName.trim();
        if (name === property.name) {
            stopEditing();
            return true;
        }
        const message = describe(name);
        if (message) {
            setProblem(message);
            return false;
        }
        stopEditing();
        operations.rename?.(property.id, name);
        return true;
    };

    const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commit();
        } else if (event.key === 'Escape') {
            event.stopPropagation();
            stopEditing();
        }
    };

    const handleRowClick = (event: MouseEvent<HTMLDivElement>) => {
        const interactive = (event.target as HTMLElement).closest(interactiveSelector);
        if (interactive && interactive.getAttribute('data-cratis-part') !== 'name') return;
        context.onPropertyClick?.(property.id);
    };

    const rowAttributes = rowState?.attributes ?? {};
    const isSelectable = context.onPropertyClick !== undefined;

    return (
        <li
            {...parts?.property}
            className={`cratis-schema-editor__property ${parts?.property?.className ?? ''}`}
            data-cratis-part='property'
            data-property-type={property.type}
        >
            <div
                {...parts?.row}
                {...rowAttributes}
                title={rowState?.title}
                className={`cratis-schema-editor__row ${rowState?.className ?? ''} ${parts?.row?.className ?? ''}`}
                data-cratis-part='row'
                data-selected={isSelected || undefined}
                onClick={handleRowClick}
            >
                {context.renderLeading && (
                    <span {...parts?.leading} className={`cratis-schema-editor__leading ${parts?.leading?.className ?? ''}`} data-cratis-part='leading'>
                        {context.renderLeading(property, rowContext)}
                    </span>
                )}

                {isEditing ? (
                    <span className='cratis-schema-editor__name-edit'>
                        <input
                            {...parts?.nameInput}
                            ref={nameInput}
                            type='text'
                            value={draftName}
                            aria-label={labels.propertyName(property.name)}
                            aria-invalid={problem !== undefined || undefined}
                            aria-describedby={problem ? messageId : undefined}
                            className={`cratis-schema-editor__name-input ${parts?.nameInput?.className ?? ''}`}
                            data-cratis-part='nameInput'
                            data-invalid={problem !== undefined || undefined}
                            onChange={event => { setDraftName(event.target.value); setProblem(undefined); }}
                            onBlur={() => { if (!commit()) stopEditing(); }}
                            onKeyDown={handleEditKeyDown}
                        />
                        {problem && (
                            <p
                                {...parts?.message}
                                id={messageId}
                                role='alert'
                                className={`cratis-schema-editor__message ${parts?.message?.className ?? ''}`}
                                data-cratis-part='message'
                            >
                                {problem}
                            </p>
                        )}
                    </span>
                ) : canRename || isSelectable ? (
                    <button
                        {...parts?.name}
                        type='button'
                        title={canRename ? labels.renameHint : undefined}
                        aria-keyshortcuts={canRename ? 'F2' : undefined}
                        className={`cratis-schema-editor__name ${parts?.name?.className ?? ''}`}
                        data-cratis-part='name'
                        onDoubleClick={startEditing}
                        onKeyDown={event => { if (event.key === 'F2') { event.preventDefault(); startEditing(); } }}
                    >
                        {property.name}
                    </button>
                ) : (
                    <span className={`cratis-schema-editor__name cratis-schema-editor__name--static ${parts?.name?.className ?? ''}`} data-cratis-part='name'>
                        {property.name}
                    </span>
                )}

                {canChangeType ? (
                    <PropertyTypeMenu
                        labels={labels}
                        concepts={context.concepts}
                        triggerPart='typeButton'
                        triggerLabel={labels.changeType(property.name, property.concept ?? typeName)}
                        parts={parts}
                        onSelect={(type, concept) => operations.changeType?.(property.id, type, concept)}
                    >
                        <PropertyTypeBadge property={property} labels={labels} part={parts?.badge} />
                    </PropertyTypeMenu>
                ) : (
                    <PropertyTypeBadge property={property} labels={labels} part={parts?.badge} />
                )}

                {canSetRequired && (
                    <label
                        {...parts?.required}
                        title={labels.requiredHelp}
                        className={`cratis-schema-editor__required ${parts?.required?.className ?? ''}`}
                        data-cratis-part='required'
                    >
                        <input
                            type='checkbox'
                            checked={property.isRequired === true}
                            disabled={readOnly}
                            aria-label={labels.requiredProperty(property.name)}
                            aria-description={labels.requiredHelp}
                            onChange={event => operations.setRequired?.(property.id, event.target.checked)}
                        />
                        {labels.required}
                    </label>
                )}

                {canSetKey && (
                    <button
                        {...parts?.key}
                        type='button'
                        aria-pressed={property.isKey === true}
                        aria-label={labels.keyProperty(property.name)}
                        title={property.isKey ? labels.isKey : labels.setAsKey}
                        className={`cratis-schema-editor__key ${parts?.key?.className ?? ''}`}
                        data-cratis-part='key'
                        data-pressed={property.isKey === true || undefined}
                        onClick={() => operations.setKey?.(property.id)}
                    >
                        <FaKey aria-hidden='true' />
                    </button>
                )}

                {context.renderAccessory && (
                    <span {...parts?.accessory} className={`cratis-schema-editor__accessory ${parts?.accessory?.className ?? ''}`} data-cratis-part='accessory'>
                        {context.renderAccessory(property, rowContext)}
                    </span>
                )}

                {isProtected ? (
                    <span
                        {...parts?.protected}
                        role='img'
                        aria-label={labels.protectedProperty}
                        title={labels.protectedProperty}
                        className={`cratis-schema-editor__protected ${parts?.protected?.className ?? ''}`}
                        data-cratis-part='protected'
                    >
                        <FaLock aria-hidden='true' />
                    </span>
                ) : canRemove && (
                    <button
                        {...parts?.remove}
                        type='button'
                        aria-label={labels.deleteProperty(property.name)}
                        title={labels.deleteProperty(property.name)}
                        className={`cratis-schema-editor__remove ${parts?.remove?.className ?? ''}`}
                        data-cratis-part='remove'
                        onClick={() => operations.remove?.(property.id)}
                    >
                        <FaXmark aria-hidden='true' />
                    </button>
                )}
            </div>

            {details && (
                <div {...parts?.details} className={`cratis-schema-editor__details ${parts?.details?.className ?? ''}`} data-cratis-part='details'>
                    {details}
                </div>
            )}

            {hasNestedProperties(property.type) && (
                <>
                    {(property.children ?? []).length > 0 && (
                        <ul
                            {...parts?.list}
                            aria-label={nestedLabel}
                            className={`cratis-schema-editor__list cratis-schema-editor__list--nested ${parts?.list?.className ?? ''}`}
                            data-cratis-part='list'
                        >
                            {(property.children ?? []).map(child => (
                                <SchemaPropertyRow key={child.id} property={child} siblings={property.children ?? []} depth={depth + 1} />
                            ))}
                        </ul>
                    )}
                    {canAddChild && (
                        <PropertyTypeMenu
                            labels={labels}
                            concepts={context.concepts}
                            triggerPart='add'
                            triggerLabel={labels.addPropertyTo(property.name)}
                            parts={parts}
                            onSelect={(type, concept) => operations.addChild?.(property.id, type, concept)}
                        >
                            <FaPlus aria-hidden='true' />
                            {labels.addProperty}
                        </PropertyTypeMenu>
                    )}
                </>
            )}
        </li>
    );
};
