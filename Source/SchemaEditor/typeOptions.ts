// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { TypeFormat } from '../types/TypeFormat';

export interface TypeOption {
    label: string;
    value: string;
}

export const CONTAINER_TYPES: TypeOption[] = [
    { label: 'array', value: 'array' },
    { label: 'object', value: 'object' },
];

const DEFAULT_TYPE_OPTIONS: TypeOption[] = [
    { label: 'string', value: 'string' },
    { label: 'integer', value: 'integer' },
    { label: 'number', value: 'number' },
    { label: 'boolean', value: 'boolean' },
];

/** The value a type format is chosen by: its format, or its JSON type when it has no format. */
export const effectiveFormat = (typeFormat: TypeFormat): string =>
    typeFormat.format ? typeFormat.format : typeFormat.jsonType;

/** Every type a property can be changed to: the known type formats (or the defaults) plus array and object. */
export const buildTypeOptions = (typeFormats: TypeFormat[]): TypeOption[] => {
    const formatOptions = typeFormats.length > 0
        ? typeFormats.map(typeFormat => ({ label: effectiveFormat(typeFormat), value: effectiveFormat(typeFormat) }))
        : DEFAULT_TYPE_OPTIONS;
    return [...formatOptions, ...CONTAINER_TYPES];
};
