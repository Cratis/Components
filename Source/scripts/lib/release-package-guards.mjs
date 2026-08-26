// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export const EXPECTED_CASCADE_LAYER_ORDER = [
    'cratis-theme',
    'cratis-components',
    'cratis-utilities',
];

const primeFamilyPattern = /@primereact\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+|@primeuix\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+|(?:primereact|primeicons)(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+)?/gu;

/** Returns the names in the first statement that binds cascade-layer precedence. */
export function firstBindingCascadeLayerOrder(styles) {
    const statement = styles.match(/@layer\s+([^;{]+);/u);
    if (!statement) return undefined;
    return statement[1].split(',').map((layer) => layer.trim());
}

/** Requires the package's first layer-order statement to bind the reviewed public order exactly. */
export function assertExpectedCascadeLayerOrder(styles, source) {
    const actual = firstBindingCascadeLayerOrder(styles);
    if (
        !actual ||
        actual.length !== EXPECTED_CASCADE_LAYER_ORDER.length ||
        actual.some((layer, index) => layer !== EXPECTED_CASCADE_LAYER_ORDER[index])
    ) {
        throw new Error(
            `${source}'s first binding cascade-layer order must be exactly ` +
                `'${EXPECTED_CASCADE_LAYER_ORDER.join(', ')}'; found ` +
                `'${actual?.join(', ') ?? '(none)'}`,
        );
    }
}

const isManifest = (entryName) => /(?:^|\/)package\.json$/u.test(entryName);
const isEmittedJavaScriptOrDeclaration = (entryName) =>
    /(?:^|\/)dist\/.*(?:\.js|\.d\.ts)$/u.test(entryName);

/**
 * Finds forbidden Prime-family references in packed manifests and emitted runtime/type files.
 * Text matching is intentionally conservative: release verification fails closed even when a
 * forbidden package name appears in a form a static import parser does not yet understand.
 */
export function findPrimeFamilyReferences(packedEntries) {
    const references = [];
    for (const [entryName, content] of packedEntries) {
        if (!isManifest(entryName) && !isEmittedJavaScriptOrDeclaration(entryName)) {
            continue;
        }

        const source = Buffer.isBuffer(content) ? content.toString('utf8') : String(content);
        const matches = [...new Set(source.match(primeFamilyPattern) ?? [])];
        for (const match of matches) references.push(`${entryName}: ${match}`);
    }
    return references;
}

/** Requires packed runtime, declarations, and manifests to remain Prime-family free. */
export function assertNoPrimeFamilyReferences(packedEntries) {
    const references = findPrimeFamilyReferences(packedEntries);
    if (references.length > 0) {
        throw new Error(
            'Packed package contains forbidden Prime-family runtime/type dependencies:\n- ' +
                references.join('\n- '),
        );
    }
}
