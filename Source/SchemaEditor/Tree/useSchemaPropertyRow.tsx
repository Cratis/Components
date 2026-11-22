// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, type MouseEvent } from 'react';
import { useRowNameEditing } from './useRowNameEditing';
import { useSchemaEditorContext, type SchemaEditorContextValue } from './SchemaEditorContext';
import type { SchemaPropertyRowProps } from './SchemaPropertyRow';
import type { SchemaPropertyRowState } from './SchemaPropertyRowState';
import type { SchemaPropertyContext } from './SchemaPropertyContext';
import { PropertyTypeBadge } from './PropertyTypeBadge';
import { hasNestedProperties, propertyTypeName } from './propertyTypeDisplay';
import { findPropertyNameProblem, PropertyNameProblem } from './propertyNaming';

const canSetKey = (context: SchemaEditorContextValue, property: SchemaPropertyRowProps['property'], rowContext: SchemaPropertyContext) =>
    !context.readOnly && context.operations.setKey !== undefined && context.isKeyAllowed(property, rowContext);

const permissions = (context: SchemaEditorContextValue, props: SchemaPropertyRowProps, rowContext: SchemaPropertyContext, rowState: SchemaPropertyRowState | undefined) => {
    const { readOnly, operations } = context;
    const isProtected = context.isProtected(props.property);
    const canModify = !readOnly && !isProtected;
    return {
        isProtected,
        canRename: canModify && operations.rename !== undefined,
        canRemove: canModify && operations.remove !== undefined,
        canChangeType: !readOnly && operations.changeType !== undefined && rowState?.lockType !== true,
        canSetKey: canSetKey(context, props.property, rowContext),
        canAddChild: !readOnly && operations.addChild !== undefined && hasNestedProperties(props.property.type),
    };
};

const describeName = (name: string, props: SchemaPropertyRowProps, context: SchemaEditorContextValue): string | undefined => {
    const { property, siblings } = props;
    const { labels } = context;
    const found = findPropertyNameProblem(name, property.id, siblings);
    if (found === PropertyNameProblem.Empty) return labels.nameRequired;
    if (found === PropertyNameProblem.Reserved) return labels.nameReserved(name);
    if (found === PropertyNameProblem.Duplicate) return labels.nameDuplicate(name);
    return context.validateName?.(name, property, siblings);
};

const selectRow = (event: MouseEvent<HTMLDivElement>, propertyId: string, context: SchemaEditorContextValue) => {
    const target = event.target as HTMLElement;
    const optedIn = target.closest('[data-schema-row-select]');
    if (optedIn && event.currentTarget.contains(optedIn)) {
        context.onPropertyClick?.(propertyId);
        return;
    }
    const interactive = target.closest('button, input, label, textarea, select, a, [role="menu"]');
    if (interactive && interactive.getAttribute('data-cratis-part') !== 'name') return;
    context.onPropertyClick?.(propertyId);
};

/** Keeps rename drafts and event handling attached to the row's stable identity. */
export const useSchemaPropertyRow = (props: SchemaPropertyRowProps) => {
    const { property, siblings, depth } = props;
    const context = useSchemaEditorContext();
    const { labels, parts, readOnly, operations } = context;
    const messageId = useId();

    const rowContext: SchemaPropertyContext = { depth, siblings, properties: context.properties, readOnly };
    const rowState = context.getRowState?.(property, rowContext);
    const details = context.renderDetails?.(property, rowContext);
    const allowed = permissions(context, props, rowContext, rowState);
    const lockReason = rowState?.lockType === true ? rowState.lockTypeReason : undefined;
    const isSelected = context.selectedPropertyId === property.id;
    const typeName = propertyTypeName(property.type, labels);
    const nestedLabel = labels.nestedProperties(property.name);

    const editing = useRowNameEditing({
        propertyId: property.id,
        propertyName: property.name,
        canRename: allowed.canRename,
        describeName: name => describeName(name, props, context),
        rename: (id, name) => operations.rename?.(id, name),
    });
    const handleRowClick = (event: MouseEvent<HTMLDivElement>) => selectRow(event, property.id, context);

    const defaultBadge = <PropertyTypeBadge property={property} labels={labels} part={parts?.badge} lockReason={lockReason} />;
    const typeBadge = context.renderTypeBadge ? context.renderTypeBadge(property, rowContext, defaultBadge) : defaultBadge;
    const rowAttributes = rowState?.attributes ?? {};
    const isSelectable = context.onPropertyClick !== undefined;

    return {
        ...props, context, rowContext, rowState, details, ...allowed, rowAttributes,
        isSelected, isSelectable, ...editing, messageId,
        handleRowClick, typeBadge, typeName, nestedLabel,
    };
};

/** Private view state shared by the row's render helpers. */
export type SchemaPropertyRowView = ReturnType<typeof useSchemaPropertyRow>;
