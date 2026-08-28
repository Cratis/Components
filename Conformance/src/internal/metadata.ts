// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import adapterSchema from '@cratis/components/schemas/ui-adapter.schema.json' with { type: 'json' };
import type { unstable_SlotId, unstable_UiLibrary } from '@cratis/components/renderer';
import type { AdapterPackageMetadata } from '../AdapterPackageMetadata.js';

interface JsonSchemaRule {
    readonly $ref?: string;
    readonly type?: string;
    readonly const?: unknown;
    readonly enum?: readonly unknown[];
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly pattern?: string;
    readonly minItems?: number;
    readonly maxItems?: number;
    readonly uniqueItems?: boolean;
    readonly items?: JsonSchemaRule;
    readonly minProperties?: number;
    readonly maxProperties?: number;
    readonly required?: readonly string[];
    readonly propertyNames?: JsonSchemaRule;
    readonly properties?: Readonly<Record<string, JsonSchemaRule>>;
    readonly additionalProperties?: boolean | JsonSchemaRule;
    readonly allOf?: readonly JsonSchemaRule[];
    readonly if?: JsonSchemaRule;
    readonly then?: JsonSchemaRule;
    readonly oneOf?: readonly JsonSchemaRule[];
}

const schema: JsonSchemaRule = adapterSchema;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const valueType = (value: unknown) => {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    if (typeof value === 'number' && Number.isInteger(value)) return 'integer';
    return typeof value === 'object' ? 'object' : typeof value;
};

const sameJson = (left: unknown, right: unknown) =>
    JSON.stringify(left) === JSON.stringify(right);

const resolveReference = (reference: string): JsonSchemaRule => {
    if (!reference.startsWith('#/')) {
        throw new Error(`Unsupported schema reference '${reference}'.`);
    }
    let current: unknown = schema;
    for (const encodedSegment of reference.slice(2).split('/')) {
        const segment = encodedSegment.replaceAll('~1', '/').replaceAll('~0', '~');
        if (!isRecord(current) || !(segment in current)) {
            throw new Error(`Unresolved schema reference '${reference}'.`);
        }
        current = current[segment];
    }
    if (!isRecord(current)) {
        throw new Error(`Schema reference '${reference}' does not resolve to a rule.`);
    }
    return current;
};

const validateAgainstSchema = (
    candidate: unknown,
    rule: JsonSchemaRule,
    location = '$',
): readonly string[] => {
    if (rule.$ref)
        return validateAgainstSchema(candidate, resolveReference(rule.$ref), location);

    const problems: string[] = [];
    const add = (message: string) => problems.push(`${location}: ${message}`);
    if (rule.type && valueType(candidate) !== rule.type) {
        add(`expected ${rule.type}, got ${valueType(candidate)}`);
        return problems;
    }
    if ('const' in rule && !sameJson(candidate, rule.const)) {
        add(`expected ${JSON.stringify(rule.const)}`);
    }
    if (rule.enum && !rule.enum.some((value) => sameJson(value, candidate))) {
        add('value is outside the declared enum');
    }
    if (typeof candidate === 'string') {
        if (rule.minLength !== undefined && candidate.length < rule.minLength) {
            add(`must have at least ${rule.minLength} characters`);
        }
        if (rule.maxLength !== undefined && candidate.length > rule.maxLength) {
            add(`must have no more than ${rule.maxLength} characters`);
        }
        if (rule.pattern && !new RegExp(rule.pattern, 'u').test(candidate)) {
            add(`does not match ${rule.pattern}`);
        }
    }
    if (Array.isArray(candidate)) {
        if (rule.minItems !== undefined && candidate.length < rule.minItems) {
            add(`must contain at least ${rule.minItems} items`);
        }
        if (rule.maxItems !== undefined && candidate.length > rule.maxItems) {
            add(`must contain no more than ${rule.maxItems} items`);
        }
        if (
            rule.uniqueItems &&
            new Set(candidate.map((item) => JSON.stringify(item))).size !==
                candidate.length
        ) {
            add('items must be unique');
        }
        if (rule.items) {
            candidate.forEach((item, index) => {
                problems.push(
                    ...validateAgainstSchema(item, rule.items!, `${location}[${index}]`),
                );
            });
        }
    }
    if (isRecord(candidate)) {
        const keys = Object.keys(candidate);
        if (rule.minProperties !== undefined && keys.length < rule.minProperties) {
            add(`must contain at least ${rule.minProperties} properties`);
        }
        if (rule.maxProperties !== undefined && keys.length > rule.maxProperties) {
            add(`must contain no more than ${rule.maxProperties} properties`);
        }
        for (const required of rule.required ?? []) {
            if (!(required in candidate)) add(`missing required property '${required}'`);
        }
        for (const key of keys) {
            if (rule.propertyNames) {
                problems.push(
                    ...validateAgainstSchema(
                        key,
                        rule.propertyNames,
                        `${location}.${key} (property name)`,
                    ),
                );
            }
            const propertyRule = rule.properties?.[key];
            if (propertyRule) {
                problems.push(
                    ...validateAgainstSchema(
                        candidate[key],
                        propertyRule,
                        `${location}.${key}`,
                    ),
                );
            } else if (rule.additionalProperties === false) {
                add(`unknown property '${key}'`);
            } else if (isRecord(rule.additionalProperties)) {
                problems.push(
                    ...validateAgainstSchema(
                        candidate[key],
                        rule.additionalProperties,
                        `${location}.${key}`,
                    ),
                );
            }
        }
    }
    for (const nested of rule.allOf ?? []) {
        problems.push(...validateAgainstSchema(candidate, nested, location));
    }
    if (
        rule.if &&
        validateAgainstSchema(candidate, rule.if, location).length === 0 &&
        rule.then
    ) {
        problems.push(...validateAgainstSchema(candidate, rule.then, location));
    }
    if (rule.oneOf) {
        const matches = rule.oneOf.filter(
            (option) => validateAgainstSchema(candidate, option, location).length === 0,
        ).length;
        if (matches !== 1) add(`must match exactly one alternative, matched ${matches}`);
    }
    return problems;
};

/** Validates package metadata against the actual published adapter schema. */
export const validateMetadata = (value: unknown): readonly string[] =>
    validateAgainstSchema(value, schema);

/** Compares static package metadata to the immutable runtime manifest. */
export const compareMetadata = (
    metadata: AdapterPackageMetadata | Readonly<Record<string, unknown>>,
    library: unstable_UiLibrary,
): readonly string[] => {
    const problems: string[] = [];
    if (metadata.id !== library.id) problems.push('id differs from runtime manifest');
    if (metadata.displayName !== library.displayName)
        problems.push('displayName differs from runtime manifest');
    if (metadata.abi !== `^${library.abi}`)
        problems.push('abi differs from runtime manifest');
    if (metadata.level !== library.level)
        problems.push('level differs from runtime manifest');
    if (metadata.profile !== library.profile)
        problems.push('profile differs from runtime manifest');
    const staticSlots = Array.isArray(metadata.slots) ? [...metadata.slots].sort() : [];
    const runtimeSlots = [...(library.profileSlots ?? Object.keys(library.slots))].sort();
    if (JSON.stringify(staticSlots) !== JSON.stringify(runtimeSlots))
        problems.push('slots differ from runtime profileSlots');
    const staticCapabilities = Array.isArray(metadata.capabilities)
        ? [...metadata.capabilities].sort()
        : [];
    if (
        JSON.stringify(staticCapabilities) !==
        JSON.stringify([...library.capabilities].sort())
    )
        problems.push('capabilities differ from runtime manifest');
    if (isRecord(metadata.modes)) {
        const modeSlots = Object.keys(metadata.modes).sort((left, right) =>
            left.localeCompare(right),
        );
        if (JSON.stringify(modeSlots) !== JSON.stringify(runtimeSlots)) {
            problems.push('mode slots differ from runtime profileSlots');
        }
        for (const slotId of runtimeSlots) {
            if (metadata.modes[slotId] !== library.slots[slotId as unstable_SlotId]?.mode)
                problems.push(`mode differs for '${slotId}'`);
        }
    }
    return problems;
};

/** Rejects capability claims that this bounded harness cannot support with the declared slots. */
export const overDeclaredCapabilities = (
    library: unstable_UiLibrary,
): readonly string[] => {
    const slots = new Set(library.profileSlots ?? Object.keys(library.slots));
    const requires: Readonly<Record<string, readonly string[]>> = {
        'focus.trap': ['dialogs.dialog'],
        'focus.restore': ['dialogs.dialog'],
        'overlay.portal': [
            'common.tooltip',
            'dropdown.select',
            'dialogs.dialog',
            'display.datePicker',
        ],
        'selection.multi': ['dropdown.select'],
        'datetime.i18n': ['display.datePicker'],
        'form.validationMessage': ['common.textInput', 'common.textArea'],
    };
    const problems: string[] = [];
    for (const capability of library.capabilities) {
        const required = requires[capability];
        if (required && !required.some((slot) => slots.has(slot)))
            problems.push(`${capability} has no supporting slot`);
        if (
            capability === 'collection.virtualize' ||
            capability === 'machine.binding' ||
            capability === 'paging.server'
        )
            problems.push(`${capability} has no evidence family in this 14-slot harness`);
    }
    if (library.capabilities.includes('slot.render')) {
        for (const slot of slots) {
            const declaration = library.slots[slot as unstable_SlotId];
            if (!declaration?.render || declaration.fidelity === 'unsupported')
                problems.push(`slot.render over-declared for '${slot}'`);
        }
    }
    return problems;
};
