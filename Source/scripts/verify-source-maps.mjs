// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MagicString from 'magic-string';
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
        source: '../../../Source/example.ts',
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
    assert.throws(
        () =>
            assertMappedToken(
                stale,
                file,
                'useExample',
                1,
                'package/Source/example.ts',
                1,
                source.indexOf('useExample'),
            ),
        /stale or incorrect source mapping/u,
    );
}

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratch = mkdtempSync(path.join(tmpdir(), 'cratis-source-maps-'));
try {
    // Exercise the actual post-emit plugin on fixtures with tokens after changed specifiers
    // on the same line. The real Rollup map does not map its synthetic static import lines.
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
    for (const [fileName, source] of fixtureSources) {
        writeFileSync(
            path.join(scratch, fileName),
            `${source}//# sourceMappingURL=${fileName}.map\n`,
        );
        writeFileSync(
            path.join(scratch, `${fileName}.map`),
            new MagicString(source)
                .generateMap({
                    source: 'fixture.ts',
                    file: fileName,
                    includeContent: true,
                    hires: true,
                })
                .toString(),
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
            'package/dist/esm/fixture.ts',
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
