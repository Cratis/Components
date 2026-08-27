// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { unstable_SlotId, unstable_UiLibrary } from '@cratis/components/renderer';
import type { AdapterPackageMetadata } from '../AdapterPackageMetadata.js';

const capabilityValues = new Set([
    'slot.render',
    'parts.passthrough',
    'focus.trap',
    'focus.restore',
    'overlay.portal',
    'collection.virtualize',
    'selection.multi',
    'datetime.i18n',
    'form.validationMessage',
    'theme.tokens',
    'ssr.staticRender',
    'rtl',
    'forcedColors',
    'motion.reduced',
    'machine.binding',
    'paging.server',
]);

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const uniqueStrings = (value: unknown): value is readonly string[] =>
    Array.isArray(value) &&
    value.every((entry) => typeof entry === 'string') &&
    new Set(value).size === value.length;

/** Validates the package metadata subset exercised by the public schema fixture. */
export const validateMetadata = (value: unknown): readonly string[] => {
    if (!isRecord(value)) return ['metadata must be an object'];
    const problems: string[] = [];
    const required = [
        'kind', 'id', 'displayName', 'abi', 'level', 'profile', 'category', 'entry',
        'export', 'slots', 'modes', 'capabilities', 'ssr', 'a11y', 'license', 'upstream',
    ];
    for (const key of required) if (!(key in value)) problems.push(`missing '${key}'`);
    const allowed = new Set(required);
    for (const key of Object.keys(value)) if (!allowed.has(key)) problems.push(`unknown '${key}'`);
    if (value.kind !== 'ui-adapter') problems.push("kind must be 'ui-adapter'");
    if (typeof value.id !== 'string' || !/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u.test(value.id)) problems.push('id is invalid');
    if (typeof value.abi !== 'string' || !/^\^[1-9][0-9]{0,2}$/u.test(value.abi)) problems.push('abi is invalid');
    if (typeof value.profile !== 'string' || !/^[a-z][a-z0-9.-]*\/v[1-9][0-9]{0,2}$/u.test(value.profile)) problems.push('profile is invalid');
    if (typeof value.entry !== 'string' || !/^\.\/(?!.*(?:^|\/)\.\.(?:\/|$))\S+$/u.test(value.entry)) problems.push('entry is invalid');
    if (!uniqueStrings(value.slots)) problems.push('slots must contain unique strings');
    if (!uniqueStrings(value.capabilities) || !(value.capabilities ?? []).every((entry: string) => capabilityValues.has(entry))) problems.push('capabilities are invalid');
    if (!isRecord(value.modes) || Object.values(value.modes).some((mode) => mode !== 'presentation' && mode !== 'atomic')) problems.push('modes are invalid');
    if (!isRecord(value.upstream) || Object.keys(value.upstream).length === 0 || Object.values(value.upstream).some((range) => typeof range !== 'string' || !(/^[~^][0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/u.test(range) || /^>=?[0-9]+(?:\.[0-9]+){0,2}(?:-[0-9A-Za-z.-]+)? <[0-9]+(?:\.[0-9]+){0,2}(?:-[0-9A-Za-z.-]+)?$/u.test(range) || /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/u.test(range)))) problems.push('upstream ranges must be bounded');
    if (!isRecord(value.license) || typeof value.license.spdx !== 'string' || typeof value.license.requiresKey !== 'boolean' || (value.license.requiresKey === true && typeof value.license.keyEnv !== 'string')) problems.push('license is invalid');
    if (!isRecord(value.a11y) || typeof value.a11y.evidence !== 'string') problems.push('a11y evidence is invalid');
    return problems;
};

/** Compares static package metadata to the immutable runtime manifest. */
export const compareMetadata = (
    metadata: AdapterPackageMetadata | Readonly<Record<string, unknown>>,
    library: unstable_UiLibrary,
): readonly string[] => {
    const problems: string[] = [];
    if (metadata.id !== library.id) problems.push('id differs from runtime manifest');
    if (metadata.displayName !== library.displayName) problems.push('displayName differs from runtime manifest');
    if (metadata.abi !== `^${library.abi}`) problems.push('abi differs from runtime manifest');
    if (metadata.level !== library.level) problems.push('level differs from runtime manifest');
    if (metadata.profile !== library.profile) problems.push('profile differs from runtime manifest');
    const staticSlots = Array.isArray(metadata.slots) ? [...metadata.slots].sort() : [];
    const runtimeSlots = [...(library.profileSlots ?? Object.keys(library.slots))].sort();
    if (JSON.stringify(staticSlots) !== JSON.stringify(runtimeSlots)) problems.push('slots differ from runtime profileSlots');
    const staticCapabilities = Array.isArray(metadata.capabilities) ? [...metadata.capabilities].sort() : [];
    if (JSON.stringify(staticCapabilities) !== JSON.stringify([...library.capabilities].sort())) problems.push('capabilities differ from runtime manifest');
    if (isRecord(metadata.modes)) {
        for (const slotId of runtimeSlots) {
            if (metadata.modes[slotId] !== library.slots[slotId as unstable_SlotId]?.mode) problems.push(`mode differs for '${slotId}'`);
        }
    }
    return problems;
};

/** Rejects capability claims that this bounded harness cannot support with the declared slots. */
export const overDeclaredCapabilities = (library: unstable_UiLibrary): readonly string[] => {
    const slots = new Set(library.profileSlots ?? Object.keys(library.slots));
    const requires: Readonly<Record<string, readonly string[]>> = {
        'focus.trap': ['dialogs.dialog'],
        'focus.restore': ['dialogs.dialog'],
        'overlay.portal': ['common.tooltip', 'dropdown.select', 'dialogs.dialog', 'display.datePicker'],
        'selection.multi': ['dropdown.select'],
        'datetime.i18n': ['display.datePicker'],
        'form.validationMessage': ['common.textInput', 'common.textArea'],
    };
    const problems: string[] = [];
    for (const capability of library.capabilities) {
        const required = requires[capability];
        if (required && !required.some((slot) => slots.has(slot))) problems.push(`${capability} has no supporting slot`);
        if (capability === 'collection.virtualize' || capability === 'machine.binding' || capability === 'paging.server') problems.push(`${capability} has no evidence family in this 14-slot harness`);
    }
    if (library.capabilities.includes('slot.render')) {
        for (const slot of slots) {
            const declaration = library.slots[slot as unstable_SlotId];
            if (!declaration?.render || declaration.fidelity === 'unsupported') problems.push(`slot.render over-declared for '${slot}'`);
        }
    }
    return problems;
};
