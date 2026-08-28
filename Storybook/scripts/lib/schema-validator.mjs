// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

const isRecord = value => typeof value === 'object' && value !== null && !Array.isArray(value);
const valueType = value => {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    if (typeof value === 'number' && Number.isInteger(value)) return 'integer';
    return typeof value === 'object' ? 'object' : typeof value;
};
const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export const validateAgainstSchema = (candidate, schema) => {
    const resolveReference = reference => {
        if (!reference.startsWith('#/')) throw new Error(`Unsupported schema reference '${reference}'.`);
        let current = schema;
        for (const encodedSegment of reference.slice(2).split('/')) {
            const segment = encodedSegment.replaceAll('~1', '/').replaceAll('~0', '~');
            if (!isRecord(current) || !(segment in current)) {
                throw new Error(`Unresolved schema reference '${reference}'.`);
            }
            current = current[segment];
        }
        if (!isRecord(current)) throw new Error(`Schema reference '${reference}' does not resolve to a rule.`);
        return current;
    };

    const validate = (value, rule, location = '$') => {
        if (rule.$ref) return validate(value, resolveReference(rule.$ref), location);
        const problems = [];
        const add = message => problems.push(`${location}: ${message}`);
        if (rule.type && valueType(value) !== rule.type) {
            add(`expected ${rule.type}, got ${valueType(value)}`);
            return problems;
        }
        if ('const' in rule && !sameJson(value, rule.const)) add(`expected ${JSON.stringify(rule.const)}`);
        if (rule.enum && !rule.enum.some(candidateValue => sameJson(candidateValue, value))) add('value is outside the declared enum');
        if (typeof value === 'string') {
            if (rule.minLength !== undefined && value.length < rule.minLength) add(`must have at least ${rule.minLength} characters`);
            if (rule.maxLength !== undefined && value.length > rule.maxLength) add(`must have no more than ${rule.maxLength} characters`);
            if (rule.pattern && !new RegExp(rule.pattern, 'u').test(value)) add(`does not match ${rule.pattern}`);
        }
        if (Array.isArray(value)) {
            if (rule.minItems !== undefined && value.length < rule.minItems) add(`must contain at least ${rule.minItems} items`);
            if (rule.maxItems !== undefined && value.length > rule.maxItems) add(`must contain no more than ${rule.maxItems} items`);
            if (rule.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) add('items must be unique');
            if (rule.items) value.forEach((item, index) => problems.push(...validate(item, rule.items, `${location}[${index}]`)));
        }
        if (isRecord(value)) {
            const keys = Object.keys(value);
            if (rule.minProperties !== undefined && keys.length < rule.minProperties) add(`must contain at least ${rule.minProperties} properties`);
            if (rule.maxProperties !== undefined && keys.length > rule.maxProperties) add(`must contain no more than ${rule.maxProperties} properties`);
            for (const required of rule.required ?? []) if (!(required in value)) add(`missing required property '${required}'`);
            for (const key of keys) {
                if (rule.propertyNames) problems.push(...validate(key, rule.propertyNames, `${location}.${key} (property name)`));
                const propertyRule = rule.properties?.[key];
                if (propertyRule) problems.push(...validate(value[key], propertyRule, `${location}.${key}`));
                else if (rule.additionalProperties === false) add(`unknown property '${key}'`);
                else if (isRecord(rule.additionalProperties)) problems.push(...validate(value[key], rule.additionalProperties, `${location}.${key}`));
            }
        }
        for (const nested of rule.allOf ?? []) problems.push(...validate(value, nested, location));
        if (rule.if && validate(value, rule.if, location).length === 0 && rule.then) problems.push(...validate(value, rule.then, location));
        if (rule.oneOf) {
            const matches = rule.oneOf.filter(option => validate(value, option, location).length === 0).length;
            if (matches !== 1) add(`must match exactly one alternative, matched ${matches}`);
        }
        return problems;
    };

    return validate(candidate, schema);
};
