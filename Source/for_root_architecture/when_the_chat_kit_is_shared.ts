// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { describe, it } from 'vitest';

/**
 * Source-level regression for the `./Chat` / `./Canvas` shared-kit boundary
 * (Cratis/Components#118-adjacent architecture rule, enforced at the built-artifact level by
 * `scripts/verify-package-graph.mjs`). The generic, Pixi-free chat kit — bubbles, composer,
 * avatar, mentions, emoji, typing indicator — lives at `Source/Chat/Kit`, the shared home both
 * the non-spatial `./Chat` subpath and the spatial `./Canvas` subpath build on. `./Chat` must
 * never physically reach a file under `Canvas/` or `PivotViewer/`: doing so would give the
 * non-spatial subpath a spatial edge, which the built-artifact check rejects.
 *
 * This spec catches that regression from source, before a build is even required, by scanning
 * every relative import/export/dynamic-import specifier under `Source/Chat` for one that resolves
 * into `Canvas/` or `PivotViewer/`.
 */

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chatRoot = path.join(sourceRoot, 'Chat');

const SPATIAL_DIRECTORIES = ['Canvas', 'PivotViewer'];

/** Every `.ts`/`.tsx` file under `Source/Chat`, recursively. */
function collectSourceFiles(directory: string, found: string[] = []): string[] {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) collectSourceFiles(entryPath, found);
        else if (/\.tsx?$/u.test(entry.name)) found.push(entryPath);
    }
    return found;
}

/** Relative `from '...'`, `import('...')`, and `require('...')` specifiers in a file's source. */
function relativeSpecifiers(source: string): string[] {
    const specifiers: string[] = [];
    const pattern = /(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/gu;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
        const specifier = match[1];
        if (specifier.startsWith('.')) specifiers.push(specifier);
    }
    return specifiers;
}

const chatFiles = collectSourceFiles(chatRoot);

describe('when the chat kit is shared between ./Chat and ./Canvas', () => {
    it('should_find_chat_source_files_to_check', () => {
        expect(chatFiles.length).to.be.greaterThan(0);
    });

    it('should_never_let_a_chat_source_file_physically_reach_canvas_or_pivotviewer', () => {
        const violations: string[] = [];
        for (const file of chatFiles) {
            for (const specifier of relativeSpecifiers(readFileSync(file, 'utf8'))) {
                const resolved = path
                    .resolve(path.dirname(file), specifier)
                    .split(path.sep)
                    .join('/');
                const relativeToSource = path
                    .relative(sourceRoot, resolved)
                    .split(path.sep)
                    .join('/');
                if (
                    SPATIAL_DIRECTORIES.some(
                        (directory) =>
                            relativeToSource === directory ||
                            relativeToSource.startsWith(`${directory}/`),
                    )
                ) {
                    violations.push(`${path.relative(sourceRoot, file)} -> ${specifier}`);
                }
            }
        }
        expect(violations, violations.join('\n')).to.deep.equal([]);
    });

    it('should_keep_the_shared_chat_kit_at_its_canonical_non_spatial_home', () => {
        const kitIndex = path.join(chatRoot, 'Kit', 'index.ts');
        expect(() => readFileSync(kitIndex, 'utf8')).to.not.throw();
    });

    it('should_keep_a_compatibility_barrel_at_the_former_canvas_chatbubble_path', () => {
        const shimPath = path.join(
            sourceRoot,
            'Canvas',
            'shapes',
            'ChatBubble',
            'index.ts',
        );
        const shim = readFileSync(shimPath, 'utf8');
        expect(shim).to.include("from '../../../Chat/Kit'");
    });

    it('should_have_canvas_consume_the_same_canonical_kit_as_chat', () => {
        const canvasIndex = readFileSync(
            path.join(sourceRoot, 'Canvas', 'index.ts'),
            'utf8',
        );
        expect(canvasIndex).to.include("from '../Chat/Kit'");
    });
});
