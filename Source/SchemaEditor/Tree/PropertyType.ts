// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** The kinds of value a {@link Property} can hold. */
export enum PropertyType {
    /** Text. */
    String = 'string',
    /** A number, integer or fractional. */
    Number = 'number',
    /** A true or false value. */
    Boolean = 'boolean',
    /** A calendar date. */
    Date = 'date',
    /** A time of day. */
    Time = 'time',
    /** A nested object with its own properties. */
    Object = 'object',
    /** A list of text values. */
    StringArray = 'stringArray',
    /** A list of numbers. */
    NumberArray = 'numberArray',
    /** A list of nested objects, each with the same properties. */
    ObjectArray = 'objectArray',
}
