// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from './Property';
import type { SchemaEditorLabels } from './SchemaEditorLabels';
import type { SchemaEditorPartAttributes } from './SchemaEditorParts';
import { propertyTypeGlyph, propertyTypeName } from './propertyTypeDisplay';

/** Props for the type badge of a property. */
export interface PropertyTypeBadgeProps {
    /** The property whose type is shown. */
    property: Pick<Property, 'type' | 'concept'>;

    /** The resolved labels. */
    labels: Required<SchemaEditorLabels>;

    /** Attributes for the `badge` part. */
    part?: SchemaEditorPartAttributes<HTMLSpanElement>;
}

/**
 * Shows what a property is typed as: a short glyph for the primitive, followed by the concept's name when the
 * property is typed as a concept, or the type's name when it is not. The glyph is decorative.
 */
export const PropertyTypeBadge = ({ property, labels, part }: PropertyTypeBadgeProps) => (
    <span
        {...part}
        className={`cratis-schema-editor__badge ${part?.className ?? ''}`}
        data-cratis-part='badge'
        data-property-type={property.type}
    >
        <span className='cratis-schema-editor__badge-glyph' aria-hidden='true'>{propertyTypeGlyph[property.type]}</span>
        <span className='cratis-schema-editor__badge-name'>{property.concept ?? propertyTypeName(property.type, labels)}</span>
    </span>
);
