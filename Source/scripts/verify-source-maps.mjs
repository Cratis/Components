// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MagicString from 'magic-string';
import remapping from '@jridgewell/remapping';
import ts from 'typescript';
import { packArtifact } from './lib/packed-artifact.mjs';
import {
    assertMappedToken,
    assertPackedSourceMaps,
} from './lib/published-source-maps.mjs';
import { fixRelativeEsmSpecifiers } from '../../rollup.config.mjs';

// A pre-rewrite map is valid JSON, resolves its source and still returns a position: only
// checking the original column after an inline specifier can expose that it is stale.
for (const extension of ['js', 'd.ts']) {
    const source = `export const example = import('./Example').then(useExample);\n`;
    const file = `package/dist/esm/example.${extension}`;
    const original = new MagicString(source).generateMap({
        source: '../../Source/example.ts',
        file: `example.${extension}`,
        includeContent: true,
        hires: true,
    });
    const stale = new Map([
        [
            file,
            Buffer.from(
                source.replace("./Example'", "./Example.js'") +
                    `//# sourceMappingURL=example.${extension}.map\n`,
            ),
        ],
        [`${file}.map`, Buffer.from(original.toString())],
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
    const rewrite = new MagicString(source);
    rewrite.update(
        source.indexOf('./Example'),
        source.indexOf('./Example') + './Example'.length,
        './Example.js',
    );
    const composed = remapping(
        [
            rewrite.generateMap({
                source: `example.${extension}`,
                file: `example.${extension}`,
                hires: true,
            }),
            original,
        ],
        () => null,
    );
    const corrected = new Map(stale);
    corrected.set(`${file}.map`, Buffer.from(JSON.stringify(composed)));
    checkToken(corrected);
}

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
    // Exercise the actual post-emit plugin with several specifier edits on a single line.
    // Sparse tsc-like maps anchor just the start of the line and the following token, not
    // every character; the composition must preserve that token's original column.
    const fixtureSources = [
        [
            'fixture.js',
            "import { Example } from './Example'; export { Example } from './Example'; const value = import('./Example').then(useExample);\n",
            'useExample',
            3,
        ],
        [
            'fixture.d.ts',
            "export type { Example } from './Example'; export type Value = import('./Example').Value;\n",
            '.Value',
            2,
        ],
    ];
    const fixtureEntries = new Map();
    for (const [fileName, source, token] of fixtureSources) {
        writeFileSync(
            path.join(scratch, fileName),
            `${source}//# sourceMappingURL=${fileName}.map\n`,
        );
        const sourceName = `${fileName}.source.ts`;
        writeFileSync(path.join(scratch, sourceName), source);
        const sparseMap = new MagicString(source);
        sparseMap.addSourcemapLocation(source.indexOf(token));
        writeFileSync(
            path.join(scratch, `${fileName}.map`),
            sparseMap.generateMap({
                source: sourceName,
                file: fileName,
            }).toString(),
        );
    }
    writeFileSync(path.join(scratch, 'Example.js'), 'export const Example = 1;\n');
    fixRelativeEsmSpecifiers(scratch).closeBundle();
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
    }

    const { entries } = packArtifact(packageDir, scratch);
    const counts = assertPackedSourceMaps(entries);

    // Both modules import a rewritten relative specifier before the mapped declaration. Rollup
    // does not assign source segments to its synthetic JS import lines; the first mapped runtime
    // token is on the next line. The declaration sample also has inline import() type references.
    for (const [file, token, declaration] of [
        ['Canvas/CanvasItem.js', 'CanvasItem', false],
        ['renderer/coreSlots.d.ts', 'unstable_coreSlots', true],
    ]) {
        const entry = `package/dist/esm/${file}`;
        const generated = entries.get(entry).toString('utf8').split('\n');
        const generatedLine =
            generated.findIndex((line) =>
                line.includes(
                    declaration ? `declare const ${token}` : `const ${token} =`,
                ),
            ) + 1;
        assert.ok(generatedLine, `Missing ${token} in ${entry}`);
        const originalEntry = `package/${declaration ? 'renderer/coreSlots.ts' : 'Canvas/CanvasItem.tsx'}`;
        const map = JSON.parse(entries.get(`${entry}.map`).toString('utf8'));
        const original =
            map.sourcesContent?.[0] ??
            readFileSync(
                path.join(packageDir, originalEntry.slice('package/'.length)),
                'utf8',
            );
        const originalLines = original.split('\n');
        const originalLine =
            originalLines.findIndex((line) => line.includes(`export const ${token}`)) + 1;
        assert.ok(originalLine, `Missing ${token} in original source`);
        assertMappedToken(
            entries,
            entry,
            token,
            generatedLine,
            originalEntry,
            originalLine,
            originalLines[originalLine - 1].indexOf(token),
        );
    }
    console.log(
        `Packed source maps validated (${counts.rewrittenJavaScript} rewritten JS, ` +
            `${counts.rewrittenDeclarations} rewritten declarations); stale-map fixtures rejected.`,
    );
} finally {
    rmSync(scratch, { recursive: true, force: true });
}
