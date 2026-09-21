// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const IGNORED_DIRECTORY_NAMES = new Set(['dist', 'node_modules', 'storybook-static']);
const SOURCE_FILE_PATTERN = /\.tsx?$/u;
const SLOT_HOOK_PATTERN = /\bunstable_useSlot\s*\(/u;

/**
 * Matches every `from '<specifier>'` (import or export) plus bare `import '<specifier>'` side
 * effect statements. Deliberately does not distinguish `import type` from value imports: a
 * type-only edge is followed too, so the scope derivation can only over-include, never silently
 * drop a component that genuinely composes a renderer slot.
 */
const IMPORT_SPECIFIER_PATTERN = /\bfrom\s*(['"])((?:(?!\1).)+)\1|(?:^|[\n;])\s*import\s*(['"])((?:(?!\3).)+)\3/gsu;

const collectFiles = (directory, predicate, results = []) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (IGNORED_DIRECTORY_NAMES.has(entry.name)) continue;
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            collectFiles(entryPath, predicate, results);
            continue;
        }
        if (entry.isFile() && predicate(entryPath)) results.push(entryPath);
    }
    return results;
};

const isProductionModule = filePath =>
    SOURCE_FILE_PATTERN.test(filePath) &&
    !filePath.endsWith('.stories.ts') &&
    !filePath.endsWith('.stories.tsx') &&
    !filePath.includes(`${path.sep}for_`);

/**
 * Derives the renderer slot registry directly from source: every production module that calls
 * `unstable_useSlot(...)` owns (or locally declares a Core fallback for) a renderer slot. This is
 * the same mechanism `RendererContext` resolves against, so a newly slotted component is picked
 * up automatically the next time this runs, with no separate list to maintain.
 *
 * @param {string} sourceRoot Absolute path to the `Source` workspace.
 * @returns {ReadonlySet<string>} Absolute paths of slot-owning modules.
 */
export const findSlotOwningModules = sourceRoot => {
    const candidates = collectFiles(sourceRoot, isProductionModule);
    const owning = new Set();
    for (const filePath of candidates) {
        const contents = readFileSync(filePath, 'utf8');
        if (SLOT_HOOK_PATTERN.test(contents)) owning.add(filePath);
    }
    return owning;
};

const extractSpecifiers = source => {
    const specifiers = [];
    IMPORT_SPECIFIER_PATTERN.lastIndex = 0;
    let match = IMPORT_SPECIFIER_PATTERN.exec(source);
    while (match) {
        const specifier = match[2] ?? match[4];
        if (specifier) specifiers.push(specifier);
        match = IMPORT_SPECIFIER_PATTERN.exec(source);
    }
    return specifiers;
};

const resolveRelativeModule = (fromFile, specifier) => {
    if (!specifier.startsWith('.')) return undefined;
    const base = path.resolve(path.dirname(fromFile), specifier);
    const candidates = [base, `${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')];
    return candidates.find(candidate => existsSync(candidate) && statSync(candidate).isFile());
};

/**
 * Whether `file` transitively reaches a slot-owning module, computed as a per-node property:
 * `reaches(file) = file owns a slot OR some file it imports reaches a slot`. Memoized per file so
 * it is safe to share `memo` across every story's entry point — unlike memoizing an entire
 * traversal's visited set (which would wrongly credit unrelated sibling imports with reachability
 * they do not individually have), this only ever records a truth that holds for that file alone.
 * `pending` breaks import cycles conservatively (treated as non-reaching) without poisoning the
 * shared memo; cyclic component imports are not a pattern this codebase uses.
 */
const moduleReachesSlot = (file, slotOwningModules, memo, pending = new Set()) => {
    if (memo.has(file)) return memo.get(file);
    if (slotOwningModules.has(file)) {
        memo.set(file, true);
        return true;
    }
    if (pending.has(file) || !existsSync(file)) return false;
    pending.add(file);
    let reaches = false;
    const source = readFileSync(file, 'utf8');
    for (const specifier of extractSpecifiers(source)) {
        const resolved = resolveRelativeModule(file, specifier);
        if (resolved && moduleReachesSlot(resolved, slotOwningModules, memo, pending)) {
            reaches = true;
            break;
        }
    }
    pending.delete(file);
    memo.set(file, reaches);
    return reaches;
};

/**
 * Partitions story index entries into those that must run the full renderer matrix and those that
 * only need the built-in renderer. A story joins the matrix when its component (or, absent a
 * declared `component`, the story module itself) transitively imports a module that owns a
 * renderer slot — directly (the nine-slot presentation profile, or an experimental slot such as
 * `dropdown.select` or `dialogs.dialog`) or indirectly (a composite like `CommandDialog` or
 * `DataPage` that renders a slotted primitive inside it).
 *
 * @param {object} params
 * @param {readonly object[]} params.storyEntries Story-type entries from a built `index.json`.
 * @param {string} params.repositoryRoot Absolute repository root; `importPath`/`componentPath` in
 *   the index are relative to it.
 * @param {string} params.sourceRoot Absolute path to the `Source` workspace, used to derive the
 *   slot registry.
 * @returns {{ slotOwningModules: ReadonlySet<string>, matrixStoryIds: ReadonlySet<string>,
 *   componentMatrixMembership: ReadonlyMap<string, boolean> }}
 */
export const computeRendererMatrixScope = ({ storyEntries, repositoryRoot, sourceRoot }) => {
    const slotOwningModules = findSlotOwningModules(sourceRoot);
    const memo = new Map();
    const componentMatrixMembership = new Map();
    const matrixStoryIds = new Set();
    for (const entry of storyEntries) {
        const relativeEntryPoint = entry.componentPath ?? entry.importPath;
        const entryPoint = path.resolve(repositoryRoot, relativeEntryPoint);
        if (!componentMatrixMembership.has(relativeEntryPoint)) {
            componentMatrixMembership.set(relativeEntryPoint, moduleReachesSlot(entryPoint, slotOwningModules, memo));
        }
        if (componentMatrixMembership.get(relativeEntryPoint)) matrixStoryIds.add(entry.id);
    }
    return { slotOwningModules, matrixStoryIds, componentMatrixMembership };
};
