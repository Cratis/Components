// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { FaWandMagicSparkles } from 'react-icons/fa6';
import type { Property } from './Property';
import type { SchemaPropertyContext } from './SchemaPropertyContext';
import { useSchemaEditorContext, type SchemaEditorContextValue } from './SchemaEditorContext';

/** The property and its position in the tree. */
interface GeneratedToggleProps {
    property: Property;
    rowContext: SchemaPropertyContext;
}

function canToggleGenerated(context: SchemaEditorContextValue, property: Property, rowContext: SchemaPropertyContext): boolean {
    return !context.readOnly && context.operations.setGenerated !== undefined && context.isGeneratedAllowed(property, rowContext);
}

/** Offers the Generated toggle, or shows a non-interactive marker for a generated value. */
export const GeneratedToggle = ({ property, rowContext }: GeneratedToggleProps) => {
    const context = useSchemaEditorContext();
    const { labels, parts, operations } = context;
    const { generated = {} } = parts ?? {};
    const className = `cratis-schema-editor__toggle cratis-schema-editor__generated ${generated.className ?? ''}`;
    const label = labels.generatedProperty(property.name);
    const icon = <FaWandMagicSparkles aria-hidden='true' />;

    if (canToggleGenerated(context, property, rowContext)) {
        return (
            <button
                {...generated}
                type='button'
                aria-pressed={property.isGenerated === true}
                aria-label={label}
                title={property.isGenerated ? labels.isGenerated : labels.setAsGenerated}
                className={className}
                data-cratis-part='generated'
                data-pressed={property.isGenerated === true || undefined}
                onClick={() => operations.setGenerated?.(property.id, !property.isGenerated)}
            >
                {icon}
            </button>
        );
    }
    if (!property.isGenerated) return null;
    return (
        <span className={className} style={{ ...generated.style, cursor: 'default' }} role='img' aria-label={label} title={label} data-cratis-part='generated' data-pressed>
            {icon}
        </span>
    );
};
