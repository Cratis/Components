// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { FaKey, FaLock, FaXmark } from 'react-icons/fa6';
import { PropertyTypeMenu } from './PropertyTypeMenu';
import type { SchemaPropertyRowView } from './useSchemaPropertyRow';

/** Keeps the badge interactive only when type changes are available. */
export const renderSchemaPropertyType = (view: SchemaPropertyRowView) => {
    const { context, property, canChangeType, typeBadge, typeName } = view;
    const { labels, parts, operations } = context;
    return canChangeType ? (
        <PropertyTypeMenu
            labels={labels}
            concepts={context.concepts}
            triggerPart='typeButton'
            triggerLabel={labels.changeType(property.name, property.concept ?? typeName)}
            parts={parts}
            onSelect={(type, concept) => operations.changeType?.(property.id, type, concept)}
        >
            {typeBadge}
        </PropertyTypeMenu>
    ) : typeBadge;
};

/** Renders the required toggle or its locked marker. */
export const renderSchemaPropertyRequired = ({ context, property }: SchemaPropertyRowView) => {
    const { labels, parts, operations, readOnly } = context;
    return context.isRequiredAllowed && operations.setRequired !== undefined && (
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
    );
};

/** Renders the key toggle when the property can be a key. */
export const renderSchemaPropertyKey = ({ context: { labels, parts, operations }, property, canSetKey }: SchemaPropertyRowView) => canSetKey && (
    <button
        {...parts?.key}
        type='button'
        aria-pressed={property.isKey === true}
        aria-label={labels.keyProperty(property.name)}
        title={property.isKey ? labels.isKey : labels.setAsKey}
        className={`cratis-schema-editor__toggle cratis-schema-editor__key ${parts?.key?.className ?? ''}`}
        data-cratis-part='key'
        data-pressed={property.isKey === true || undefined}
        onClick={() => operations.setKey?.(property.id)}
    >
        <FaKey aria-hidden='true' />
    </button>
);

/** Renders the removal button or the protected marker. */
export const renderSchemaPropertyRemoval = ({ context: { labels, parts, operations }, property, isProtected, canRemove }: SchemaPropertyRowView) => isProtected ? (
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
        aria-label={labels.deletePropertyFor(property.name)}
        title={labels.deletePropertyFor(property.name)}
        className={`cratis-schema-editor__remove ${parts?.remove?.className ?? ''}`}
        data-cratis-part='remove'
        onClick={() => operations.remove?.(property.id)}
    >
        <FaXmark aria-hidden='true' />
    </button>
);

/** Renders the host accessory slot. The row keeps each control as a direct child so generated ids stay stable. */
export const renderSchemaPropertyAccessory = ({ context, property, rowContext }: SchemaPropertyRowView) => context.renderAccessory && (
    <span {...context.parts?.accessory} className={`cratis-schema-editor__accessory ${context.parts?.accessory?.className ?? ''}`} data-cratis-part='accessory'>
        {context.renderAccessory(property, rowContext)}
    </span>
);
