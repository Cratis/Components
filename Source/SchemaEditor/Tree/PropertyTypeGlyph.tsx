// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PropertyType } from './PropertyType';

const iconProps = {
    viewBox: '0 0 12 12',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    width: 11,
    height: 11,
    'aria-hidden': true,
} as const;

const glyphs: Record<PropertyType, React.ReactNode> = {
    [PropertyType.String]: 'Aa',
    [PropertyType.Number]: '123',
    [PropertyType.Boolean]: 'T/F',
    [PropertyType.Date]: (
        <svg {...iconProps}>
            <rect x='1' y='2.5' width='10' height='8.5' rx='1.5' />
            <path d='M1 5.5h10M4 1v3M8 1v3' />
        </svg>
    ),
    [PropertyType.Time]: (
        <svg {...iconProps}>
            <circle cx='6' cy='6' r='4.5' />
            <path d='M6 3.5v2.5l2 1' />
        </svg>
    ),
    [PropertyType.Object]: '{}',
    [PropertyType.StringArray]: '[A]',
    [PropertyType.NumberArray]: '[#]',
    [PropertyType.ObjectArray]: '[{}]',
};

/** Props for the glyph of a property type. */
export interface PropertyTypeGlyphProps {
    /** The type whose glyph is shown. */
    type: PropertyType;
}

/**
 * A short colored chip identifying a property type at a glance. It is decorative: the type's name is always
 * next to it, so it is hidden from assistive technology.
 */
export const PropertyTypeGlyph = ({ type }: PropertyTypeGlyphProps) => (
    <span className='cratis-schema-editor__badge-glyph' data-property-type={type} aria-hidden='true'>{glyphs[type]}</span>
);
