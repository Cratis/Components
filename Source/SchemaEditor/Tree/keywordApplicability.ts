// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { KeywordFamily } from './KeywordFamily';
import { PropertyType } from './PropertyType';

const annotations: ReadonlySet<string> = new Set(['title', 'description', '$comment', 'deprecated', 'readOnly', 'writeOnly']);

const refinementKeywords: ReadonlySet<string> = new Set(['default', 'enum', 'const', 'examples', 'multipleOf']);

const familyKeywords: Readonly<Record<KeywordFamily, ReadonlySet<string>>> = {
    [KeywordFamily.None]: new Set(),
    [KeywordFamily.String]: new Set(['minLength', 'maxLength', 'pattern', 'contentEncoding', 'contentMediaType']),
    [KeywordFamily.Number]: new Set(['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf']),
    [KeywordFamily.Array]: new Set(['minItems', 'maxItems', 'uniqueItems', 'contains', 'minContains', 'maxContains']),
    [KeywordFamily.Object]: new Set([
        'minProperties', 'maxProperties', 'additionalProperties', 'patternProperties', 'propertyNames',
        'dependentRequired', 'dependentSchemas', 'unevaluatedProperties',
    ]),
};

const typeFamilies: Readonly<Record<PropertyType, KeywordFamily>> = {
    [PropertyType.String]: KeywordFamily.String,
    [PropertyType.Date]: KeywordFamily.String,
    [PropertyType.Time]: KeywordFamily.String,
    [PropertyType.Number]: KeywordFamily.Number,
    [PropertyType.Boolean]: KeywordFamily.None,
    [PropertyType.Object]: KeywordFamily.Object,
    [PropertyType.StringArray]: KeywordFamily.Array,
    [PropertyType.NumberArray]: KeywordFamily.Array,
    [PropertyType.ObjectArray]: KeywordFamily.Array,
};

/**
 * The keyword family of a property type.
 * @param type The property type.
 * @returns The family whose constraints apply to values of the type.
 */
export function propertyTypeFamily(type: PropertyType): KeywordFamily {
    return typeFamilies[type];
}

/**
 * The keyword family of a JSON Schema `type` value.
 * @param type The `type` keyword of a schema node.
 * @returns The family whose constraints apply to values of the type.
 */
export function jsonTypeFamily(type: unknown): KeywordFamily {
    switch (type) {
        case 'string':
            return KeywordFamily.String;
        case 'number':
        case 'integer':
            return KeywordFamily.Number;
        case 'array':
            return KeywordFamily.Array;
        case 'object':
            return KeywordFamily.Object;
        default:
            return KeywordFamily.None;
    }
}

/**
 * Whether a standard keyword that the editor does not model still applies after the type changed.
 * Annotations always apply and a family's constraints apply while the family stays the same; value
 * keywords (default, enum, const, examples), type refinements and every other keyword do not. The modelled
 * keywords (type, format, items, properties, required) and `x-` keywords are not decided here.
 * @param keyword The keyword name.
 * @param from The family of the type before the change.
 * @param to The family of the type after the change.
 * @returns True when the keyword applies to the new type.
 */
export function isKeywordApplicable(keyword: string, from: KeywordFamily, to: KeywordFamily): boolean {
    return annotations.has(keyword) || (from === to && familyKeywords[to].has(keyword));
}

/**
 * Keeps the keywords that still apply after the type changed.
 * @param keywords The standard keywords the editor does not model.
 * @param from The family of the type before the change.
 * @param to The family of the type after the change.
 * @returns The keywords that apply; empty when none do.
 */
export function keywordsAfterTypeChange(
    keywords: Readonly<Record<string, unknown>>,
    from: KeywordFamily,
    to: KeywordFamily,
): Record<string, unknown> {
    return Object.fromEntries(Object.entries(keywords).filter(([keyword]) => isKeywordApplicable(keyword, from, to)));
}

/**
 * Whether a keyword survives a change between refinements of one type, such as integer and number: the
 * constraints stay, but the value keywords and `multipleOf` described the old refinement.
 * @param keyword The keyword name.
 * @returns True when the keyword still applies.
 */
export function isKeywordApplicableToRefinement(keyword: string): boolean {
    return !refinementKeywords.has(keyword);
}
