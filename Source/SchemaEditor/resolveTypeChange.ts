// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { TypeFormat } from '../types/TypeFormat';
import { CONTAINER_TYPES, effectiveFormat } from './typeOptions';

export type TypeChange =
    | { kind: 'arrayItem'; type: string }
    | { kind: 'property'; type: string; format: string | undefined };

interface TypeAndFormat {
    type: string;
    format: string | undefined;
}

const resolveTypeAndFormat = (value: string, typeFormats: TypeFormat[]): TypeAndFormat => {
    if (CONTAINER_TYPES.some(container => container.value === value)) {
        return { type: value, format: undefined };
    }
    const typeFormat = typeFormats.find(candidate => effectiveFormat(candidate) === value);
    if (!typeFormat) {
        return { type: value, format: undefined };
    }
    return { type: typeFormat.jsonType, format: typeFormat.format ? value : undefined };
};

/** Works out what choosing `value` in a type dropdown means for the property, or for its array items. */
export const resolveTypeChange = (value: string, typeFormats: TypeFormat[], isArrayItem: boolean): TypeChange => {
    const { type, format } = resolveTypeAndFormat(value, typeFormats);
    return isArrayItem ? { kind: 'arrayItem', type } : { kind: 'property', type, format };
};
