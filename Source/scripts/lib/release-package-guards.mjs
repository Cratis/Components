// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export const EXPECTED_CASCADE_LAYER_ORDER = [
    'properties',
    'cratis-theme',
    'cratis-components',
    'cratis-utilities',
];

const primeFamilyPattern = /@primereact\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+|@primeuix\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+|(?:primereact|primeicons)(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+)?/gu;

/**
 * Matches every `@layer` construct that establishes cascade-layer order: a forward-declaration
 * statement (`@layer properties;`), a precedence-binding statement naming several layers at once
 * (`@layer cratis-theme, cratis-components, cratis-utilities;`), and a block that opens/reopens a
 * named layer (`@layer cratis-theme { ... }`). An anonymous `@layer { ... }` block (no name before
 * the brace) does not participate in named cascade order and is not matched.
 */
const layerDeclarationPattern = /@layer\s+([^;{}]+)\s*[;{]/gu;

/**
 * Returns the cumulative order in which distinct layer names are first established across the
 * whole stylesheet - every `@layer` statement and block, not just the first one.
 *
 * A single "first `@layer ...;` statement" reading is not reliable: Tailwind emits a leading,
 * single-name `@layer properties;` forward declaration (for its `@property` custom-property
 * fallback) ahead of the statement that actually binds Cratis's own precedence, so the first
 * statement in the file legitimately has only one name. Cascade order is decided by first
 * appearance of each layer name anywhere in the file
 * (https://www.w3.org/TR/css-cascade-5/#layer-ordering), so that is what this walks.
 */
export function cascadeLayerEstablishmentOrder(styles) {
    const order = [];
    const seen = new Set();
    for (const match of styles.matchAll(layerDeclarationPattern)) {
        for (const rawName of match[1].split(',')) {
            const name = rawName.trim();
            if (!name || seen.has(name)) continue;
            seen.add(name);
            order.push(name);
        }
    }
    return order;
}

/**
 * Requires the package's cascade layers to be established in exactly the reviewed cumulative
 * order - no missing layer, no reordering, and no other layer's first appearance sneaking in
 * ahead of one of ours (whether by an out-of-order block or a duplicate/reordered statement).
 */
export function assertExpectedCascadeLayerOrder(styles, source) {
    const actual = cascadeLayerEstablishmentOrder(styles);
    const matches =
        actual.length === EXPECTED_CASCADE_LAYER_ORDER.length &&
        actual.every((layer, index) => layer === EXPECTED_CASCADE_LAYER_ORDER[index]);
    if (!matches) {
        throw new Error(
            `${source}'s cumulative cascade-layer establishment order must be exactly ` +
                `'${EXPECTED_CASCADE_LAYER_ORDER.join(', ')}'; found ` +
                `'${actual.join(', ') || '(none)'}'.`,
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
