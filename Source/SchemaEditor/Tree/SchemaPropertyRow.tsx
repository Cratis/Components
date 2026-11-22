// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from './Property';
import { renderSchemaPropertyName } from './SchemaPropertyRowName';
import { GeneratedToggle } from './GeneratedToggle';
import {
    renderSchemaPropertyAccessory,
    renderSchemaPropertyKey,
    renderSchemaPropertyRemoval,
    renderSchemaPropertyRequired,
    renderSchemaPropertyType
} from './SchemaPropertyRowControls';
import { renderSchemaPropertyChildren } from './SchemaPropertyRowChildren';
import { useSchemaPropertyRow } from './useSchemaPropertyRow';

/** Props for one row of the editor, and everything nested under it. */
export interface SchemaPropertyRowProps {
    /** The property shown. */
    property: Property;

    /** The properties that share its parent, including itself. */
    siblings: Property[];

    /** How deeply the property is nested. */
    depth: number;
}

/** One property: its row of controls, the host's details beneath it, and the properties nested under it. */
export const SchemaPropertyRow = (props: SchemaPropertyRowProps) => {
    const view = useSchemaPropertyRow(props);
    const { property, context, rowContext, rowState, rowAttributes, isSelected, handleRowClick, details } = view;
    const { parts } = context;

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
                {renderSchemaPropertyName(view)}
                {renderSchemaPropertyType(view)}
                {renderSchemaPropertyRequired(view)}
                {renderSchemaPropertyKey(view)}
                <GeneratedToggle property={property} rowContext={rowContext} />
                {renderSchemaPropertyAccessory(view)}
                {renderSchemaPropertyRemoval(view)}
            </div>
            {details && (
                <div {...parts?.details} className={`cratis-schema-editor__details ${parts?.details?.className ?? ''}`} data-cratis-part='details'>
                    {details}
                </div>
            )}
            {renderSchemaPropertyChildren(view)}
        </li>
    );
};
