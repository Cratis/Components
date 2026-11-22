// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { FaPlus } from 'react-icons/fa6';
import { SchemaPropertyRow } from './SchemaPropertyRow';
import { PropertyTypeMenu } from './PropertyTypeMenu';
import { hasNestedProperties } from './propertyTypeDisplay';
import type { SchemaPropertyRowView } from './useSchemaPropertyRow';

/** Renders the nested list and its add action without adding any wrapper elements. */
export const renderSchemaPropertyChildren = (view: SchemaPropertyRowView) => {
    const { property, depth, nestedLabel, canAddChild, context } = view;
    const { labels, parts, operations } = context;
    return hasNestedProperties(property.type) && (
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
    );
};
