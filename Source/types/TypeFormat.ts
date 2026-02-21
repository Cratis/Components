// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export interface TypeFormat {
    jsonType: string;
    format: string;
}

export const DEFAULT_TYPE_FORMATS: TypeFormat[] = [
    { jsonType: 'string', format: '' },
    { jsonType: 'string', format: 'guid' },
    { jsonType: 'string', format: 'date-time' },
    { jsonType: 'string', format: 'date' },
    { jsonType: 'string', format: 'time' },
    { jsonType: 'integer', format: '' },
    { jsonType: 'integer', format: 'int16' },
    { jsonType: 'integer', format: 'int32' },
    { jsonType: 'integer', format: 'int64' },
    { jsonType: 'number', format: '' },
    { jsonType: 'number', format: 'float' },
    { jsonType: 'number', format: 'double' },
    { jsonType: 'boolean', format: '' },
];
