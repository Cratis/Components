// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode, encode } from '@jridgewell/sourcemap-codec';
import ts from 'typescript';
import { packArtifact } from './lib/packed-artifact.mjs';
import {
    assertMappedToken,
    assertPackedSourceMaps,
} from './lib/published-source-maps.mjs';
import {
    fixRelativeEsmSpecifiers,
    readRewrittenSourceMaps,
    rewrittenSourceMapsManifest,
} from '../../rollup.config.mjs';

// A pre-rewrite map is valid JSON, resolves its source and still returns a position: only
// checking the original column after an inline specifier can expose that it is stale.
for (const extension of ['js', 'd.ts']) {
    const source = `export const example = import('./Example').then(useExample);\n`;
    const file = `package/dist/esm/example.${extension}`;
    const original = {
        version: 3,
        file: `example.${extension}`,
        sources: ['../../Source/example.ts'],
        sourcesContent: [source],
        names: [],
        mappings: encode([
            Array.from({ length: source.indexOf('\n') + 1 }, (_, column) => [
                column,
                0,
                0,
                column,
            ]),
        ]),
    };
    const stale = new Map([
        [
            file,
            Buffer.from(
                source.replace("./Example'", "./Example.js'") +
                    `//# sourceMappingURL=example.${extension}.map\n`,
            ),
        ],
        [`${file}.map`, Buffer.from(JSON.stringify(original))],
    ]);
    const checkToken = (entries) =>
        assertMappedToken(
            entries,
            file,
            'useExample',
            1,
            'package/Source/example.ts',
            1,
            source.indexOf('useExample'),
        );
    assert.throws(() => checkToken(stale), /stale or incorrect source mapping/u);

    // Same generated text and source/line, but with the edited columns composed correctly.
    const editEnd = source.indexOf('./Example') + './Example'.length;
    const correctedMap = {
        ...original,
        mappings: encode(
            decode(original.mappings).map((segments) =>
                segments.map(([column, ...originalPosition]) => [
                    column >= editEnd ? column + 3 : column,
                    ...originalPosition,
                ]),
            ),
        ),
    };
    const corrected = new Map(stale);
    corrected.set(`${file}.map`, Buffer.from(JSON.stringify(correctedMap)));
    checkToken(corrected);
}

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The build writes this outside dist: the archive alone cannot distinguish a tsc shim
// changed by this pass from a Rollup module that already imported relative .js files.
const rewrittenFiles = new Set(
    readRewrittenSourceMaps(rewrittenSourceMapsManifest(packageDir)).map(
        (file) => `package/dist/esm/${file}`,
    ),
);

// TypeScript only follows declaration maps to source files on disk. These source files exist
// beside this in-repo build, even though Source/*.tsx is excluded from the published archive.
const navigationFile = path.join(packageDir, 'scripts', 'source-map-navigation.ts');
const navigationSource = [
    "import type { CanvasItemRegistryEntry } from '../dist/esm/Canvas/Canvas.js';",
    "import type { CanvasItemProps } from '../dist/esm/Canvas/CanvasItem.js';",
    'type Rewritten = CanvasItemRegistryEntry;',
    'type Unchanged = CanvasItemProps;',
].join('\n');
const navigationHost = {
    getScriptFileNames: () => [navigationFile],
    getScriptVersion: () => '0',
    getScriptSnapshot: (file) => {
        const content = file === navigationFile ? navigationSource : ts.sys.readFile(file);
        return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
    },
    getCurrentDirectory: () => packageDir,
    // The language service and the source mapper must canonicalize paths the same way;
    // otherwise the mapper cannot find declaration files on case-sensitive file systems.
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    getCompilationSettings: () => ({
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        jsx: ts.JsxEmit.ReactJSX,
        skipLibCheck: true,
    }),
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: (file) => file === navigationFile || ts.sys.fileExists(file),
    readFile: (file) => file === navigationFile ? navigationSource : ts.sys.readFile(file),
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    realpath: ts.sys.realpath,
};
const languageService = ts.createLanguageService(navigationHost);
// tsserver maps the language-service definition through the declaration map before returning
// it to editors. getDefinitionAtPosition alone reports the intermediate .d.ts location.
const sourceMapper = ts.getSourceMapper({
    ...navigationHost,
    getProgram: () => languageService.getProgram(),
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    log: () => {},
});
try {
    for (const [symbol, sourceFile] of [
        ['CanvasItemRegistryEntry', 'Canvas/Canvas.tsx'], // Rewritten declaration
        ['CanvasItemProps', 'Canvas/CanvasItem.tsx'], // Unchanged declaration
    ]) {
        const usage = navigationSource.lastIndexOf(symbol);
        const declaration = languageService.getDefinitionAtPosition(navigationFile, usage)?.[0];
        assert.ok(declaration, `No definition for ${symbol}`);
        assert.equal(
            declaration.fileName,
            path.join(packageDir, 'dist/esm', sourceFile.replace('.tsx', '.d.ts')),
            `${symbol} did not resolve through its declaration`,
        );
        const definition = ts.getMappedDocumentSpan(declaration, sourceMapper, ts.sys.fileExists);
        const source = path.join(packageDir, sourceFile);
        const sourceText = readFileSync(source, 'utf8');
        const expected = sourceText.indexOf(`export interface ${symbol}`);
        assert.ok(expected >= 0, `${sourceFile} is missing ${symbol}`);
        assert.ok(definition, `${symbol} has no navigable declaration map`);
        assert.equal(definition.fileName, source, `${symbol} did not navigate to its source`);
        assert.equal(definition.textSpan.start, expected + 'export interface '.length);

        // Recreate the old emitted map without touching dist. TypeScript discards it even
        // when the embedded bytes are identical to the source file on disk.
        const mapFile = `${declaration.fileName}.map`;
        const map = JSON.parse(readFileSync(mapFile, 'utf8'));
        const blockedMapper = ts.getSourceMapper({
            ...navigationHost,
            getProgram: () => languageService.getProgram(),
            useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
            log: () => {},
            readFile: (file) =>
                file === mapFile
                    ? JSON.stringify({
                          ...map,
                          sourcesContent: map.sources.map(() => sourceText),
                      })
                    : navigationHost.readFile(file),
        });
        assert.equal(
            ts.getMappedDocumentSpan(declaration, blockedMapper, ts.sys.fileExists),
            undefined,
            `${symbol} unexpectedly navigated through embedded declaration content`,
        );
    }
} finally {
    languageService.dispose();
}
const scratch = mkdtempSync(path.join(tmpdir(), 'cratis-source-maps-'));
try {
    // Exercise the actual post-emit plugin with multiple edits on one line, mapping anchors
    // at edit boundaries, after every edit, at end of line, and on an unedited second line.
    const fixtureSources = [
        [
            'fixture.js',
            "import { Example } from './Example'; export { Example } from './Example'; const value = import('./Example').then(useExample);\nexport const untouched = 1;\n",
            'useExample',
            3,
        ],
        [
            'fixture.d.ts',
            "export type { Example } from './Example'; export type Value = import('./Example').Value;\nexport type Untouched = number;\n",
            '.Value',
            2,
        ],
    ];
    const fixtureEntries = new Map();
    const writeFixture = ([fileName, source, token]) => {
        writeFileSync(
            path.join(scratch, fileName),
            `${source}//# sourceMappingURL=${fileName}.map\n`,
        );
        const sourceName = `${fileName}.source.ts`;
        writeFileSync(path.join(scratch, sourceName), source);
        const originalLines = source.trimEnd().split('\n');
        const columns = originalLines.map((line, lineIndex) =>
            lineIndex === 0
                ? [
                      ...new Set([
                          0,
                          ...[...line.matchAll(/\.\/Example/gu)].flatMap(({ index }) => [
                              index,
                              index + 2,
                              index + './Example'.length,
                          ]),
                          line.indexOf(token),
                          line.length, // tsc emits end-of-line segments, including on edited lines.
                      ]),
                  ].sort((a, b) => a - b)
                : [0, line.search(/[Uu]ntouched/u), line.length],
        );
        writeFileSync(
            path.join(scratch, `${fileName}.map`),
            JSON.stringify({
                version: 3,
                file: fileName,
                sources: [sourceName],
                names: [],
                mappings: encode(
                    columns.map((lineColumns, lineIndex) =>
                        lineColumns.map((column) => [column, 0, lineIndex, column]),
                    ),
                ),
            }),
        );
    };
    writeFileSync(path.join(scratch, 'Example.js'), 'export const Example = 1;\n');
    const fixtureManifest = path.join(scratch, 'rewritten-source-maps.json');
    const cleanBuildMessage = /Run a clean build in Source: yarn prepare/u;
    assert.throws(() => readRewrittenSourceMaps(fixtureManifest), cleanBuildMessage);
    writeFileSync(fixtureManifest, '[]');
    assert.throws(() => readRewrittenSourceMaps(fixtureManifest), cleanBuildMessage);

    writeFixture(fixtureSources[0]);
    fixRelativeEsmSpecifiers(scratch, fixtureManifest).closeBundle();
    assert.deepEqual(readRewrittenSourceMaps(fixtureManifest), ['fixture.js']);
    writeFixture(fixtureSources[1]);
    fixRelativeEsmSpecifiers(scratch, fixtureManifest).closeBundle();
    assert.deepEqual(readRewrittenSourceMaps(fixtureManifest), ['fixture.d.ts', 'fixture.js']);
    writeFileSync(fixtureManifest, JSON.stringify(['missing.js', 'fixture.js', 'fixture.d.ts']));
    fixRelativeEsmSpecifiers(scratch, fixtureManifest).closeBundle();
    assert.deepEqual(readRewrittenSourceMaps(fixtureManifest), ['fixture.d.ts', 'fixture.js']);
    rmSync(fixtureManifest);

    for (const [fileName, source, token, count] of fixtureSources) {
        const entry = `package/dist/esm/${fileName}`;
        const rewritten = readFileSync(path.join(scratch, fileName), 'utf8');
        assert.equal(rewritten.match(/\.\/Example\.js/gu)?.length, count);
        fixtureEntries.set(entry, Buffer.from(rewritten));
        fixtureEntries.set(
            `${entry}.map`,
            readFileSync(path.join(scratch, `${fileName}.map`)),
        );
        assertMappedToken(
            fixtureEntries,
            entry,
            token,
            1,
            `package/dist/esm/${fileName}.source.ts`,
            1,
            source.indexOf(token),
        );
        const original = source.trimEnd().split('\n');
        const edits = [...original[0].matchAll(/\.\/Example/gu)].map(
            ({ index }) => index + './Example'.length,
        );
        const mappings = decode(JSON.parse(fixtureEntries.get(`${entry}.map`)).mappings);
        const expected = original.map((line, lineIndex) => {
            const columns =
                lineIndex === 0
                    ? [
                          ...new Set([
                              0,
                              ...edits.flatMap((end) => [
                                  end - './Example'.length,
                                  end - './Example'.length + 2,
                                  end,
                              ]),
                              line.indexOf(token),
                              line.length,
                          ]),
                      ].sort((a, b) => a - b)
                    : [0, line.search(/[Uu]ntouched/u), line.length];
            return columns.map((column) => {
                const earlier =
                    lineIndex === 0 ? edits.filter((end) => end <= column).length : 0;
                const containing =
                    lineIndex === 0
                        ? edits.find(
                              (end) => column > end - './Example'.length && column < end,
                          )
                        : undefined;
                return [
                    containing === undefined
                        ? column + 3 * earlier
                        : containing - './Example'.length + 3 * earlier,
                    0,
                    lineIndex,
                    column,
                ];
            });
        });
        assert.deepEqual(
            mappings,
            expected,
            `${fileName} lost or shifted source-map segments`,
        );
    }

    const { entries } = packArtifact(packageDir, scratch);
    const counts = assertPackedSourceMaps(entries, rewrittenFiles);
    assert.ok(
        !rewrittenFiles.has('package/dist/esm/Canvas/CanvasItem.js'),
        'Rollup-emitted CanvasItem.js must not be counted as rewritten',
    );

    // Both tsc re-export shims have a mapped end-of-line segment after a rewritten
    // specifier. Requiring that exact shifted segment catches even a stale map whose
    // last original segment might otherwise resolve the query to the right source column.
    for (const file of ['Chat/Kit/index.js', 'Chat/Kit/index.d.ts']) {
        const entry = `package/dist/esm/${file}`;
        assert.ok(rewrittenFiles.has(entry), `${entry} was not rewritten`);
        const generated = entries.get(entry).toString('utf8').split('\n');
        const generatedLine =
            generated.findIndex((line) =>
                line.startsWith("export { Chat } from './Chat.js';"),
            ) + 1;
        assert.ok(generatedLine, `Missing Chat re-export in ${entry}`);
        const originalEntry = 'package/Chat/Kit/index.ts';
        const originalLines = readFileSync(
            path.join(packageDir, 'Chat/Kit/index.ts'),
            'utf8',
        ).split('\n');
        const originalLine =
            originalLines.findIndex((line) =>
                line.startsWith("export { Chat } from './Chat';"),
            ) + 1;
        assert.ok(originalLine, `Missing Chat re-export in ${originalEntry}`);
        const checkEndOfLine = (packed) =>
            assertMappedToken(
                packed,
                entry,
                "';",
                generatedLine,
                originalEntry,
                originalLine,
                originalLines[originalLine - 1].length,
                2,
            );
        checkEndOfLine(entries);
        // A map with the pre-rewrite end-of-line segment still resolves to the right
        // source position by nearest preceding segment; exact-column checking rejects it.
        const stale = new Map(entries);
        const staleMap = JSON.parse(stale.get(`${entry}.map`).toString('utf8'));
        const segments = decode(staleMap.mappings);
        segments[generatedLine - 1].at(-1)[0] -= 3;
        staleMap.mappings = encode(segments);
        stale.set(`${entry}.map`, Buffer.from(JSON.stringify(staleMap)));
        assert.throws(() => checkEndOfLine(stale), /no exact segment/u);
    }
    console.log(
        `Packed source maps validated (${counts.rewrittenJavaScript} actually rewritten JS, ` +
            `${counts.rewrittenDeclarations} actually rewritten declarations); stale-map fixtures rejected.`,
    );
} finally {
    rmSync(scratch, { recursive: true, force: true });
}
