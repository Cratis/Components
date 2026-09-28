// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import path from 'node:path';
import {
    decodedMappings,
    originalPositionFor,
    TraceMap,
} from '@jridgewell/trace-mapping';

const archiveRoot = 'package/';
const esmPrefix = `${archiveRoot}dist/esm/`;
const mappingReference = /\/\/# sourceMappingURL=([^\r\n]+)/u;
const moduleSpecifier = /(?:\bfrom\s*|\bimport\s*\()(['"])\.{1,2}\/[^'"\r\n]+\.js\1/u;

function text(entries, entry) {
    const content = entries.get(entry);
    assert.ok(content, `Missing packed file ${entry}`);
    return content.toString('utf8');
}

function mapFor(entries, entry) {
    const generated = text(entries, entry);
    const reference = generated.match(mappingReference)?.[1];
    assert.ok(reference, `${entry} has no sourceMappingURL`);
    const mapEntry = path.posix.normalize(
        path.posix.join(path.posix.dirname(entry), reference),
    );
    assert.ok(mapEntry.startsWith(archiveRoot), `${entry} has an unsafe map reference`);
    const map = JSON.parse(text(entries, mapEntry));
    assert.equal(map.version, 3, `${mapEntry} has an invalid version`);
    assert.equal(typeof map.mappings, 'string', `${mapEntry} has no mappings`);
    decodedMappings(new TraceMap(map));
    return { generated, map, mapEntry };
}

/** Verify the references and original source bytes of every map actually shipped. */
export function assertPackedSourceMaps(entries) {
    let rewrittenJavaScript = 0;
    let rewrittenDeclarations = 0;
    for (const entry of entries.keys()) {
        if (!entry.startsWith(esmPrefix) || !/\.(?:js|d\.ts)$/u.test(entry)) continue;
        const generated = text(entries, entry);
        if (!generated.match(mappingReference)) {
            assert.ok(
                !moduleSpecifier.test(generated),
                `${entry} rewrites specifiers but has no map`,
            );
            continue;
        }
        const { map, mapEntry } = mapFor(entries, entry);
        if (moduleSpecifier.test(generated)) {
            if (entry.endsWith('.d.ts')) rewrittenDeclarations++;
            else rewrittenJavaScript++;
        }
        if (entry.endsWith('.d.ts')) {
            assert.ok(
                !Object.hasOwn(map, 'sourcesContent'),
                `${mapEntry} must not embed sourcesContent in a declaration map`,
            );
            // Declaration maps remain useful when the original sources exist in a linked workspace.
            continue;
        }
        for (const [index, source] of map.sources.entries()) {
            const resolved = path.posix.normalize(
                path.posix.join(
                    path.posix.dirname(mapEntry),
                    map.sourceRoot ?? '',
                    source,
                ),
            );
            assert.ok(
                entries.has(resolved) || typeof map.sourcesContent?.[index] === 'string',
                `${mapEntry} cannot resolve source ${source} in the archive and has no sourcesContent`,
            );
        }
    }
    for (const entry of entries.keys()) {
        if (!entry.startsWith(esmPrefix) || !entry.endsWith('.map')) continue;
        const generatedEntry = entry.slice(0, -4);
        assert.ok(entries.has(generatedEntry), `${entry} is orphaned`);
        assert.ok(
            text(entries, generatedEntry).includes(path.posix.basename(entry)),
            `${entry} is unreferenced`,
        );
    }
    assert.ok(rewrittenJavaScript > 0, 'No rewritten JavaScript was checked');
    assert.ok(rewrittenDeclarations > 0, 'No rewritten declarations were checked');
    return { rewrittenJavaScript, rewrittenDeclarations };
}

/** Check an exact original source position, not merely whether the map parses or has a segment. */
export function assertMappedToken(
    entries,
    entry,
    token,
    generatedLine,
    sourceEntry,
    sourceLine,
    sourceColumn,
) {
    const { generated, map } = mapFor(entries, entry);
    const line = generated.split('\n')[generatedLine - 1];
    const column = line.indexOf(token);
    assert.ok(column >= 0, `${entry}:${generatedLine} is missing ${token}`);
    const position = originalPositionFor(new TraceMap(map), {
        line: generatedLine,
        column,
    });
    const expectedSource = path.posix.relative(path.posix.dirname(entry), sourceEntry);
    assert.deepEqual(
        { source: position.source, line: position.line, column: position.column },
        { source: expectedSource, line: sourceLine, column: sourceColumn },
        `${entry}:${generatedLine}:${column} (${token}) has a stale or incorrect source mapping`,
    );
}
