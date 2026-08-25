// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { transformSource } from '../lib/transform.js';
import {
    approvedRootSymbols as codemodApprovedRootSymbols,
    namespaceSubpaths as codemodNamespaceSubpaths,
} from '../lib/namespaceMap.js';
import {
    approvedRootSymbols as eslintApprovedRootSymbols,
    namespaceSubpaths as eslintNamespaceSubpaths,
} from '../../ESLint/lib/rootNamespaceMap.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

const readFixture = (name, file) =>
    readFileSync(path.join(fixturesDir, name, file), 'utf8');

// Fixtures where the codemod is expected to rewrite input.ts into expected.ts.
const supportedCases = [
    'value-import',
    'type-import',
    'alias-import',
    'mixed-import',
    'multiple-namespaces',
    'command-stepper-alias',
];

// Fixtures where the codemod must leave the file completely untouched: either because it
// is already migrated / already narrow, or because the case is deliberately unsupported and
// reported rather than guessed at.
const unchangedCases = [
    'already-migrated',
    'narrow-subpath-untouched',
    'unsupported-namespace-import',
    'unsupported-default-import',
    'unsupported-dynamic-import',
    'unsupported-require',
    'unsupported-unknown-symbol',
    'unsupported-side-effect-only',
    'unsupported-export',
];

const unsupportedCases = new Set([
    'unsupported-namespace-import',
    'unsupported-default-import',
    'unsupported-dynamic-import',
    'unsupported-require',
    'unsupported-unknown-symbol',
    'unsupported-side-effect-only',
    'unsupported-export',
]);

describe('root namespace maps', () => {
    it('should keep the codemod and ESLint namespace maps identical', () => {
        expect(codemodNamespaceSubpaths).toEqual(eslintNamespaceSubpaths);
    });

    it('should keep the codemod and ESLint setup allowlists identical', () => {
        expect([...codemodApprovedRootSymbols].sort()).toEqual(
            [...eslintApprovedRootSymbols].sort(),
        );
    });
});

describe('transformSource — fixture coverage', () => {
    it('covers every fixture directory with a supported or unchanged expectation', () => {
        const allFixtureDirs = readdirSync(fixturesDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);
        const covered = new Set([...supportedCases, ...unchangedCases]);

        expect(new Set(allFixtureDirs)).toEqual(covered);
    });

    for (const name of supportedCases) {
        it(`rewrites '${name}' to its expected output and reports no diagnostics`, () => {
            const input = readFixture(name, 'input.ts');
            const expected = readFixture(name, 'expected.ts');

            const result = transformSource(`${name}/input.ts`, input);

            expect(result.text).toBe(expected);
            expect(result.changed).toBe(true);
            expect(result.diagnostics).toEqual([]);
        });
    }

    for (const name of unchangedCases) {
        it(`leaves '${name}' completely unchanged`, () => {
            const input = readFixture(name, 'input.ts');
            const expected = readFixture(name, 'expected.ts');
            expect(expected).toBe(input); // fixture sanity: expected.ts must equal input.ts here

            const result = transformSource(`${name}/input.ts`, input);

            expect(result.text).toBe(input);
            expect(result.changed).toBe(false);
        });
    }

    for (const name of unsupportedCases) {
        it(`reports at least one diagnostic for '${name}'`, () => {
            const input = readFixture(name, 'input.ts');
            const result = transformSource(`${name}/input.ts`, input);

            expect(result.diagnostics.length).toBeGreaterThan(0);
            for (const diagnostic of result.diagnostics) {
                expect(diagnostic.file).toBe(`${name}/input.ts`);
                expect(diagnostic.line).toBeGreaterThan(0);
                expect(diagnostic.column).toBeGreaterThan(0);
                expect(diagnostic.message.length).toBeGreaterThan(0);
            }
        });
    }

    it('reports no diagnostics for already-migrated or narrow-subpath-only files', () => {
        for (const name of ['already-migrated', 'narrow-subpath-untouched']) {
            const input = readFixture(name, 'input.ts');
            const result = transformSource(`${name}/input.ts`, input);
            expect(result.diagnostics).toEqual([]);
        }
    });

    it('is idempotent: re-running on its own output for every supported fixture changes nothing further', () => {
        for (const name of supportedCases) {
            const expected = readFixture(name, 'expected.ts');
            const second = transformSource(`${name}/expected.ts`, expected);

            expect(second.text).toBe(expected);
            expect(second.changed).toBe(false);
            expect(second.diagnostics).toEqual([]);
        }
    });

    it('is idempotent: re-running twice in a row on a fresh input converges to the same fixed point', () => {
        const input = readFixture('mixed-import', 'input.ts');
        const first = transformSource('mixed-import/input.ts', input);
        const second = transformSource('mixed-import/input.ts', first.text);
        const third = transformSource('mixed-import/input.ts', second.text);

        expect(second.text).toBe(first.text);
        expect(second.changed).toBe(false);
        expect(third.text).toBe(first.text);
    });
});

describe('transformSource — targeted behavior', () => {
    it('preserves an unrelated existing subpath import untouched alongside a rewritten root import', () => {
        const input = [
            "import { Dialog } from '@cratis/components/Dialogs';",
            "import { Canvas } from '@cratis/components';",
            '',
            'export const dialog = Dialog;',
            'export const shapes = Canvas;',
            '',
        ].join('\n');

        const result = transformSource('file.ts', input);

        expect(result.text).toBe(
            [
                "import { Dialog } from '@cratis/components/Dialogs';",
                "import * as Canvas from '@cratis/components/Canvas';",
                '',
                'export const dialog = Dialog;',
                'export const shapes = Canvas;',
                '',
            ].join('\n'),
        );
        expect(result.changed).toBe(true);
    });

    it('respects a custom package name and ignores the default package name', () => {
        const input =
            "import { Canvas } from '@acme/ui';\nimport { Canvas as C2 } from '@cratis/components';\n";

        const result = transformSource('file.ts', input, { packageName: '@acme/ui' });

        expect(result.text).toBe(
            "import * as Canvas from '@acme/ui/Canvas';\nimport { Canvas as C2 } from '@cratis/components';\n",
        );
    });

    it('leaves a package name that merely shares a prefix untouched', () => {
        const input = "import { Canvas } from '@cratis/components-extra';\n";

        const result = transformSource('file.ts', input);

        expect(result.text).toBe(input);
        expect(result.changed).toBe(false);
        expect(result.diagnostics).toEqual([]);
    });

    it('does not report or change a file with no @cratis/components import at all', () => {
        const input = "import { useState } from 'react';\nexport const x = useState;\n";

        const result = transformSource('file.tsx', input);

        expect(result.text).toBe(input);
        expect(result.changed).toBe(false);
        expect(result.diagnostics).toEqual([]);
    });

    it('leaves the whole statement untouched when one specifier is unrecognized, even with a recognized namespace alongside it', () => {
        const input = "import { Canvas, Button } from '@cratis/components';\n";

        const result = transformSource('file.ts', input);

        expect(result.text).toBe(input);
        expect(result.changed).toBe(false);
        expect(result.diagnostics).toHaveLength(1);
        expect(result.diagnostics[0].message).toContain("'Button'");
    });
});
