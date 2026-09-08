// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = path.join(packageDir, 'schemas/ui-adapter.schema.json');
const readJson = (filePath, description) => {
    try {
        return JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new Error(`Unable to read ${description} from '${filePath}'.`, {
            cause: error,
        });
    }
};
const fixturePaths = [
    'renderer/for_slot_types/slotTyping.fixture.ts',
    'renderer/for_slot_types/presentationTyping.fixture.ts',
].map((relativePath) => path.join(packageDir, relativePath));
const schema = readJson(schemaPath, 'renderer adapter schema');
const packageJson = readJson(
    path.join(packageDir, 'package.json'),
    'Components package manifest',
);

const valueType = (value) => {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    if (Number.isInteger(value)) return 'integer';
    return typeof value === 'object' ? 'object' : typeof value;
};

const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const resolveReference = (reference) => {
    if (!reference.startsWith('#/'))
        throw new Error(`Unsupported schema reference '${reference}'.`);
    let current = schema;
    for (const encodedSegment of reference.slice(2).split('/')) {
        const segment = encodedSegment.replaceAll('~1', '/').replaceAll('~0', '~');
        if (!current || typeof current !== 'object' || !Object.hasOwn(current, segment)) {
            throw new Error(`Unresolved schema reference '${reference}'.`);
        }
        current = current[segment];
    }
    return current;
};

const validate = (candidate, rule, location = '$') => {
    if (rule.$ref) return validate(candidate, resolveReference(rule.$ref), location);

    const problems = [];
    const add = (message) => problems.push(`${location}: ${message}`);
    if (rule.type && valueType(candidate) !== rule.type) {
        add(`expected ${rule.type}, got ${valueType(candidate)}`);
        return problems;
    }
    if (Object.hasOwn(rule, 'const') && !sameJson(candidate, rule.const))
        add(`expected ${JSON.stringify(rule.const)}`);
    if (rule.enum && !rule.enum.some((value) => sameJson(value, candidate)))
        add('value is outside the declared enum');
    if (typeof candidate === 'string') {
        if (rule.minLength !== undefined && candidate.length < rule.minLength)
            add(`must have at least ${rule.minLength} characters`);
        if (rule.maxLength !== undefined && candidate.length > rule.maxLength)
            add(`must have no more than ${rule.maxLength} characters`);
        if (rule.pattern && !new RegExp(rule.pattern, 'u').test(candidate))
            add(`does not match ${rule.pattern}`);
    }
    if (Array.isArray(candidate)) {
        if (rule.minItems !== undefined && candidate.length < rule.minItems)
            add(`must contain at least ${rule.minItems} items`);
        if (rule.maxItems !== undefined && candidate.length > rule.maxItems)
            add(`must contain no more than ${rule.maxItems} items`);
        if (
            rule.uniqueItems &&
            new Set(candidate.map((item) => JSON.stringify(item))).size !==
                candidate.length
        )
            add('items must be unique');
        if (rule.items)
            candidate.forEach((item, index) =>
                problems.push(...validate(item, rule.items, `${location}[${index}]`)),
            );
    }
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        const keys = Object.keys(candidate);
        if (rule.minProperties !== undefined && keys.length < rule.minProperties)
            add(`must contain at least ${rule.minProperties} properties`);
        if (rule.maxProperties !== undefined && keys.length > rule.maxProperties)
            add(`must contain no more than ${rule.maxProperties} properties`);
        for (const required of rule.required ?? []) {
            if (!Object.hasOwn(candidate, required))
                add(`missing required property '${required}'`);
        }
        for (const key of keys) {
            if (rule.propertyNames)
                problems.push(
                    ...validate(
                        key,
                        rule.propertyNames,
                        `${location}.${key} (property name)`,
                    ),
                );
            const propertyRule =
                rule.properties && Object.hasOwn(rule.properties, key)
                    ? rule.properties[key]
                    : undefined;
            if (propertyRule) {
                problems.push(
                    ...validate(candidate[key], propertyRule, `${location}.${key}`),
                );
            } else if (rule.additionalProperties === false) {
                add(`unknown property '${key}'`);
            } else if (
                rule.additionalProperties &&
                typeof rule.additionalProperties === 'object'
            ) {
                problems.push(
                    ...validate(
                        candidate[key],
                        rule.additionalProperties,
                        `${location}.${key}`,
                    ),
                );
            }
        }
    }
    for (const nested of rule.allOf ?? [])
        problems.push(...validate(candidate, nested, location));
    if (rule.if && validate(candidate, rule.if, location).length === 0 && rule.then)
        problems.push(...validate(candidate, rule.then, location));
    if (rule.oneOf) {
        const matches = rule.oneOf.filter(
            (option) => validate(candidate, option, location).length === 0,
        ).length;
        if (matches !== 1) add(`must match exactly one alternative, matched ${matches}`);
    }
    return problems;
};

const validManifest = {
    kind: 'ui-adapter',
    id: 'future-suite',
    displayName: 'Future Suite',
    abi: '^1',
    level: 'full',
    profile: 'basic-controls/v1',
    category: 'styled-suite',
    entry: './dist/esm/index.js',
    export: 'FutureSuite',
    slots: ['common.button', 'future.widget'],
    modes: { 'common.button': 'presentation', 'future.widget': 'atomic' },
    capabilities: ['slot.render', 'parts.passthrough', 'ssr.staticRender'],
    ssr: 'safe',
    a11y: { axeProfile: 'wcag22aa', evidence: './CONFORMANCE.md' },
    license: { spdx: 'MIT', requiresKey: false },
    upstream: { '@future/ui': '>=2 <3' },
};

const validProblems = validate(validManifest, schema);
if (validProblems.length > 0) {
    console.error(
        `Valid renderer manifest failed schema validation:\n- ${validProblems.join('\n- ')}`,
    );
    process.exit(1);
}

const inheritedKindManifest = Object.setPrototypeOf(
    Object.fromEntries(Object.entries(validManifest).filter(([key]) => key !== 'kind')),
    { kind: 'ui-adapter' },
);
const invalidManifests = [
    { ...validManifest, level: 'unknown' },
    { ...validManifest, unexpected: true },
    { ...validManifest, constructor: 'unexpected' },
    inheritedKindManifest,
    { ...validManifest, upstream: { '@future/ui': '*' } },
    { ...validManifest, modes: { 'common.button': 'hybrid' } },
    { ...validManifest, license: { spdx: 'Proprietary', requiresKey: true } },
];
for (const invalid of invalidManifests) {
    if (validate(invalid, schema).length === 0) {
        console.error(
            `Invalid renderer manifest unexpectedly passed: ${JSON.stringify(invalid)}`,
        );
        process.exit(1);
    }
}
const builtInMetadataProblems = validate(packageJson.cratis, schema);
if (builtInMetadataProblems.length > 0) {
    console.error(
        `Built-in renderer package metadata failed schema validation:\n- ${builtInMetadataProblems.join('\n- ')}`,
    );
    process.exit(1);
}
if (
    packageJson.cratis.slots.length !== 14 ||
    Object.keys(packageJson.cratis.modes).length !== 14 ||
    !packageJson.cratis.entry.includes('/renderer/builtin/')
) {
    console.error(
        'Built-in renderer metadata must describe exactly fourteen slots at the opt-in subpath.',
    );
    process.exit(1);
}
console.log(
    'Renderer metadata schema accepts the built-in/static fixtures and rejects invalid manifests.',
);

const tsc = path.resolve(packageDir, '../node_modules/typescript/bin/tsc');
const typeCheck = spawnSync(
    process.execPath,
    [
        tsc,
        '--ignoreConfig',
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        'true',
        '--target',
        'ES2022',
        '--module',
        'ESNext',
        '--moduleResolution',
        'bundler',
        '--jsx',
        'react-jsx',
        '--lib',
        'ESNext,DOM,DOM.Iterable',
        ...fixturePaths,
    ],
    { cwd: packageDir, encoding: 'utf8', timeout: 120_000 },
);
if (typeCheck.status !== 0) {
    console.error(
        `Renderer slot typing fixture failed:\n${typeCheck.stdout}${typeCheck.stderr}`,
    );
    process.exit(1);
}
console.log('Renderer slot typing fixtures compile under strict TypeScript.');

const atomicFacadeFiles = [
    'Common/Tooltip.tsx',
    'Common/DatePickerInput.tsx',
    'Dropdown/Dropdown.tsx',
    'Dialogs/Dialog.tsx',
    'DataTables/TablePaginator.tsx',
];
for (const relative of atomicFacadeFiles) {
    const source = readFileSync(path.join(packageDir, relative), 'utf8');
    if (!source.includes("mode: 'atomic'") || !source.includes('Object.freeze({')) {
        console.error(
            `Atomic facade '${relative}' must own a frozen local atomic declaration.`,
        );
        process.exit(1);
    }
}

const overlayImplementationFiles = [
    'Common/TooltipImplementation.tsx',
    'Common/DatePickerInputImplementation.tsx',
    'Dropdown/DropdownImplementation.tsx',
    'Dialogs/DialogImplementation.tsx',
];
for (const relative of overlayImplementationFiles) {
    const source = readFileSync(path.join(packageDir, relative), 'utf8');
    if (
        !source.includes("from 'react-aria'") ||
        !source.includes('getContainer={overlayEnvironment.getContainer}')
    ) {
        console.error(
            `Atomic overlay implementation '${relative}' must use the local overlay-environment callback through UNSAFE_PortalProvider.`,
        );
        process.exit(1);
    }
    if (source.includes('UNSTABLE_portalContainer')) {
        console.error(
            `Atomic overlay implementation '${relative}' must not use deprecated per-component portal containers.`,
        );
        process.exit(1);
    }
}
console.log('Atomic facades and local overlay ownership satisfy E2 source contracts.');

const ssrScript = `
delete globalThis.document;
const renderer = await import('@cratis/components/renderer');
if (renderer.unstable_defaultOverlayEnvironment.getContainer() !== null) {
    throw new Error('Default overlay environment must return null without document.');
}
if ('unstable_cratisBuiltIn' in renderer) {
    throw new Error('The lean renderer subpath must not expose the built-in implementation graph.');
}
const builtin = await import('@cratis/components/renderer/builtin');
if (Object.keys(builtin).join(',') !== 'unstable_cratisBuiltIn') {
    throw new Error('The built-in subpath must export only unstable_cratisBuiltIn.');
}
const library = builtin.unstable_cratisBuiltIn;
if (!Object.isFrozen(library) || !Object.isFrozen(library.slots) || Object.keys(library.slots).length !== 14) {
    throw new Error('The built-in manifest and complete fourteen-slot table must be frozen.');
}
`;
const ssrImport = spawnSync(
    process.execPath,
    ['--input-type=module', '--eval', ssrScript],
    { cwd: packageDir, encoding: 'utf8', timeout: 120_000 },
);
if (ssrImport.status !== 0) {
    console.error(`Renderer SSR import failed:\n${ssrImport.stdout}${ssrImport.stderr}`);
    process.exit(1);
}
console.log(
    'Renderer subpath imports with document undefined and defers DOM access until invocation.',
);
