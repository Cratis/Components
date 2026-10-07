// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId } from 'react';
import type { Property } from './Property';
import type { SchemaEditorLabels } from '../SchemaEditorLabels';
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

    /** Why the type is locked; shown as the badge's tooltip and exposed as its accessible description. */
    lockReason?: string;
}

/**
 * Shows what a property is typed as: a short glyph for the primitive, followed by the concept's name when the
 * property is typed as a concept, or the type's name when it is not. The glyph is decorative.
 */
export const PropertyTypeBadge = ({ property, labels, part, lockReason }: PropertyTypeBadgeProps) => {
    const reasonId = useId();
    return (
        <span
            {...part}
            title={lockReason ?? part?.title}
            aria-describedby={lockReason ? reasonId : part?.['aria-describedby']}
            className={`cratis-schema-editor__badge ${part?.className ?? ''}`}
            data-cratis-part='badge'
            data-property-type={property.type}
            data-locked={lockReason ? true : undefined}
        >
            <span className='cratis-schema-editor__badge-glyph' aria-hidden='true'>{propertyTypeGlyph[property.type]}</span>
            <span className='cratis-schema-editor__badge-name'>{property.concept ?? propertyTypeName(property.type, labels)}</span>
            {lockReason && <span id={reasonId} className='cratis-schema-editor__visually-hidden'>{lockReason}</span>}
        </span>
    );
};
