// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A group of JSON Schema keywords that only constrain values of one kind of type. */
export enum KeywordFamily {
    /** Types without constraint keywords of their own, such as booleans. */
    None = 'none',

    /** String values, including the date and time types. */
    String = 'string',

    /** Number values. */
    Number = 'number',

    /** Array values, whatever the item kind. */
    Array = 'array',

    /** Object values. */
    Object = 'object',
}
