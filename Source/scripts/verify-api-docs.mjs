// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Verifies that every intentionally public declaration reachable from a JavaScript
 * subpath in the `exports` map of Source/package.json carries a TSDoc comment.
 *
 * Why this exists: `@cratis/components` ships type declarations alongside every JS
 * subpath. A symbol that reaches a consumer through `import { X } from
 * '@cratis/components/<Subpath>'` (directly, or transitively through `export *` /
 * namespace re-exports) is part of the published contract - if it has no doc comment,
 * consumers get no explanation of defaults, units, ownership, callback timing, or
 * accessibility semantics from their editor. This script uses the TypeScript compiler
 * API (already a project dependency - no new dependency is added) to compute exactly
 * that reachable set from source, the same way `tsc`'s declaration emit would, and
 * fails with the offending file/symbol when a doc comment is missing.
 *
 * What counts as "reachable": starting from every JS `exports` map entry's *source*
 * barrel (not the built `.d.ts` - this runs pre-build, against `Source/**\/*.ts(x)`),
 * this follows `export *`, named re-exports, and `import * as X from './y'; export {
 * X }` namespace re-exports (aliases resolved with the TypeScript checker, the same
 * resolution consumers get) until it reaches concrete declarations - functions,
 * consts, interfaces, type aliases, enums, and classes. A local `export` that is never
 * re-exported by a barrel on the reachable path (an implementation helper such as
 * `Filter/utils.ts`'s `buildFilterValues`, kept exported only so a sibling module or a
 * `for_*` spec can import it by relative path) is invisible to this walk and is never
 * flagged - only symbols an npm consumer can actually import are checked.
 *
 * What is checked once a declaration is reached:
 *   - The declaration itself must have a non-empty TSDoc comment.
 *   - For an interface (or a type alias whose type is an object literal), every
 *     member *declared directly on that interface/type* (not one inherited through
 *     `extends`/`Omit<...>` from a type this package does not itself export) must
 *     also carry a TSDoc comment. Enum members and function parameters are not
 *     individually required to reduce noise on self-describing enums - the enum
 *     declaration itself still needs a comment.
 *
 * Usage:  node scripts/verify-api-docs.mjs [--self-test-only] [--skip-self-test]
 * Exits non-zero if the self-tests regress, or if any reachable declaration/member
 * is missing a TSDoc comment.
 */

import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Core analysis - exported so the self-tests below exercise the real logic.
// ---------------------------------------------------------------------------

/** Non-JS `exports` targets (CSS assets, the package manifest) - nothing to type-check. */
const ASSET_EXTENSIONS = ['.css', '.json'];

const isAsset = (target) =>
    typeof target === 'string' && ASSET_EXTENSIONS.some((ext) => target.endsWith(ext));

/** Picks the `types` (or `import`) file a condition resolves to. */
function targetFor(value, condition) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        if (typeof value[condition] === 'string') return value[condition];
        if (typeof value.default === 'string') return value.default;
    }
    return undefined;
}

/**
 * Maps a package.json `exports` map to the deduplicated set of *source* barrel files
 * it resolves to, keyed by every subpath that reaches that file (so a violation can
 * report every public entry point it is reachable from).
 *
 * @param pkg The parsed Source/package.json.
 * @param root Absolute path to the package directory (Source/).
 */
export function resolveBarrelsFromExports(pkg, root) {
    const exportsMap = pkg.exports ?? {};
    /** @type {Map<string, string[]>} absolute source file -> subpaths that resolve to it */
    const fileToSubpaths = new Map();
    const problems = [];

    for (const [subpath, value] of Object.entries(exportsMap)) {
        if (subpath === './package.json') continue;
        const typesTarget = targetFor(value, 'types');
        const importTarget = targetFor(value, 'import');
        if (isAsset(importTarget) || isAsset(typesTarget)) continue; // CSS
        if (!typesTarget) continue;

        // `./dist/esm/Canvas/index.d.ts` -> `Canvas/index`
        const relative = typesTarget
            .replace(/^\.\//, '')
            .replace(/^dist\/esm\//, '')
            .replace(/\.d\.ts$/, '');

        const candidates = [`${relative}.tsx`, `${relative}.ts`];
        const found = candidates.find((candidate) =>
            existsSync(path.join(root, candidate)),
        );
        if (!found) {
            problems.push(
                `${subpath}: no source file found for ${typesTarget} (tried ${candidates.join(', ')})`,
            );
            continue;
        }

        const absolute = path.join(root, found);
        const subpaths = fileToSubpaths.get(absolute) ?? [];
        subpaths.push(subpath);
        fileToSubpaths.set(absolute, subpaths);
    }

    return { fileToSubpaths, problems };
}

/** Builds a TypeScript program rooted at the given barrel source files. */
export function buildProgram(root, rootFiles) {
    const configPath = path.join(root, 'tsconfig.json');
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (configFile.error) {
        throw new Error(
            ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'),
        );
    }
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
    return ts.createProgram({ rootNames: rootFiles, options: parsed.options });
}

const isModuleLike = (symbol) =>
    (symbol.flags & (ts.SymbolFlags.ValueModule | ts.SymbolFlags.NamespaceModule)) !== 0;

/** Resolves an export symbol through any chain of aliases to its real declaration. */
function resolveAlias(checker, symbol) {
    let current = symbol;
    const seen = new Set();
    while ((current.flags & ts.SymbolFlags.Alias) !== 0 && !seen.has(current)) {
        seen.add(current);
        current = checker.getAliasedSymbol(current);
    }
    return current;
}

/** True for members that are themselves reported separately (namespaces) or synthetic. */
const DECLARATION_KINDS = new Set([
    ts.SyntaxKind.InterfaceDeclaration,
    ts.SyntaxKind.TypeAliasDeclaration,
    ts.SyntaxKind.ClassDeclaration,
    ts.SyntaxKind.EnumDeclaration,
    ts.SyntaxKind.FunctionDeclaration,
    ts.SyntaxKind.VariableDeclaration,
]);

/**
 * True when a symbol carries a usable TSDoc comment: either a plain-text summary, or a
 * JSDoc tag with its own message (most commonly `@deprecated`, used throughout this
 * package for retained-for-compatibility/no-op props - a `@deprecated` explanation *is*
 * the documentation for that member, even with no separate summary line above it).
 */
function hasDocComment(checker, symbol) {
    const summary = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
    if (summary.length > 0) return true;
    return symbol
        .getJsDocTags(checker)
        .some((tag) => ts.displayPartsToString(tag.text ?? []).trim().length > 0);
}

function locationOf(symbol) {
    const declaration = symbol.declarations?.[0];
    if (!declaration) return { file: '<unknown>', line: 0 };
    const sourceFile = declaration.getSourceFile();
    const { line } = sourceFile.getLineAndCharacterOfPosition(declaration.getStart());
    return { file: sourceFile.fileName, line: line + 1 };
}

/**
 * Members declared directly on an interface/class/type-literal symbol - deliberately
 * *not* `checker.getPropertiesOfType`, which also returns members inherited through
 * `extends`/`Omit<...>` from types this package does not itself declare (and so
 * cannot annotate). Call/construct signatures have no name and are not part of the
 * symbol table, so they are skipped without special-casing. Generic type parameters
 * (e.g. the `T` in `interface CanvasProps<T>`) live in the same symbol table as
 * properties, so they are explicitly excluded - a type parameter is documented, if at
 * all, via a `@typeParam` tag on the declaration itself, not as its own member.
 */
function ownMembersOf(target) {
    const members = [];
    if (target.members) {
        target.members.forEach((member, name) => {
            if (typeof name !== 'string' || name.startsWith('__')) return;
            if ((member.flags & ts.SymbolFlags.TypeParameter) !== 0) return;
            members.push(member);
        });
    }
    return members;
}

/**
 * Walks every reachable exported declaration starting from `rootFile`, calling
 * `visit(target, path)` once per unique concrete declaration reached (`path` is a
 * dotted symbol path such as `Canvas.CanvasProps` useful in messages). Namespace-like
 * re-exports (`export * as X` / `import * as X from './y'; export { X }`) are
 * followed recursively; each module is only ever expanded once.
 */
export function walkReachableExports(checker, program, rootFile, visit) {
    const visitedModules = new Set();
    const visitedTargets = new Set();

    const walkModule = (sourceFile, namePath) => {
        if (visitedModules.has(sourceFile)) return;
        visitedModules.add(sourceFile);

        const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
        if (!moduleSymbol) return;

        for (const exported of checker.getExportsOfModule(moduleSymbol)) {
            if (exported.name === 'default') continue;
            const target = resolveAlias(checker, exported);
            const childPath = namePath ? `${namePath}.${exported.name}` : exported.name;

            if (isModuleLike(target)) {
                const targetSourceFile = target.declarations?.find(ts.isSourceFile);
                if (targetSourceFile) {
                    walkModule(targetSourceFile, childPath);
                    continue;
                }
            }

            if (visitedTargets.has(target)) continue;
            visitedTargets.add(target);
            visit(target, childPath, exported);
        }
    };

    const sourceFile = program.getSourceFile(rootFile);
    if (!sourceFile) {
        throw new Error(`Barrel not found in program: ${rootFile}`);
    }
    walkModule(sourceFile, '');
}

/**
 * Runs the full check against one package root, returning every missing-doc
 * violation. `fileToSubpaths` comes from {@link resolveBarrelsFromExports}.
 *
 * The same declaration is frequently reachable through more than one `exports`
 * subpath (a namespace re-export at the package root, plus its own direct
 * subpath) - reachability is therefore collected for every root file first,
 * merging the name-paths/subpaths seen for each unique declaration, and the
 * doc-presence check runs once per unique declaration afterward so a gap is
 * reported exactly once, listing every subpath it is reachable from.
 */
export function findMissingDocs(root, fileToSubpaths) {
    const rootFiles = [...fileToSubpaths.keys()];
    const program = buildProgram(root, rootFiles);
    const checker = program.getTypeChecker();

    /** @type {Map<ts.Symbol, { namePaths: Set<string>, subpaths: Set<string> }>} */
    const reachable = new Map();
    const record = (target, namePath, subpaths) => {
        const entry = reachable.get(target) ?? { namePaths: new Set(), subpaths: new Set() };
        entry.namePaths.add(namePath);
        for (const subpath of subpaths) entry.subpaths.add(subpath);
        reachable.set(target, entry);
    };

    for (const [file, subpaths] of fileToSubpaths) {
        walkReachableExports(checker, program, file, (target, namePath) => {
            record(target, namePath, subpaths);
        });
    }

    /** Shortest name-path reads best in a message; ties broken alphabetically for determinism. */
    const primaryNamePath = (namePaths) =>
        [...namePaths].sort((a, b) => a.length - b.length || a.localeCompare(b))[0];

    const violations = [];

    for (const [target, { namePaths, subpaths }] of reachable) {
        const hasDeclaration = (target.declarations ?? []).some((declaration) =>
            DECLARATION_KINDS.has(declaration.kind),
        );
        if (!hasDeclaration) continue; // e.g. a plain re-exported value with no local decl kind we track

        const symbol = primaryNamePath(namePaths);
        const sortedSubpaths = [...subpaths].sort();
        if (!hasDocComment(checker, target)) {
            const { file: declFile, line } = locationOf(target);
            violations.push({
                subpaths: sortedSubpaths,
                symbol,
                file: path.relative(root, declFile),
                line,
                reason: 'missing TSDoc comment on the exported declaration',
            });
        }

        const isInterfaceLike =
            (target.flags & ts.SymbolFlags.Interface) !== 0 ||
            (target.flags & ts.SymbolFlags.TypeAlias) !== 0;
        if (!isInterfaceLike) continue;

        for (const member of ownMembersOf(target)) {
            if (hasDocComment(checker, member)) continue;
            const { file: declFile, line } = locationOf(member);
            violations.push({
                subpaths: sortedSubpaths,
                symbol: `${symbol}.${member.name}`,
                file: path.relative(root, declFile),
                line,
                reason: 'missing TSDoc comment on the member',
            });
        }
    }

    violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
    return violations;
}

// ---------------------------------------------------------------------------
// Self-tests - deterministic fixture-based regression checks for the walker
// and doc-presence logic above. Run by default before the real check so a
// change that silently breaks reachability analysis (and would otherwise let
// every finding go to zero for the wrong reason) is caught first.
// ---------------------------------------------------------------------------

function makeFixture(files) {
    const dir = mkdtempSync(path.join(tmpdir(), 'cratis-verify-api-docs-'));
    for (const [relative, content] of Object.entries(files)) {
        const absolute = path.join(dir, relative);
        mkdirSync(path.dirname(absolute), { recursive: true });
        writeFileSync(absolute, content, 'utf8');
    }
    return dir;
}

const FIXTURE_TSCONFIG = JSON.stringify({
    compilerOptions: {
        module: 'ES2022',
        moduleResolution: 'bundler',
        target: 'ES2022',
        strict: false,
        skipLibCheck: true,
        declaration: true,
        jsx: 'react-jsx',
    },
});

function assert(condition, message) {
    if (!condition) throw new Error(`Self-test failed: ${message}`);
}

function selfTestUndocumentedIsFlagged() {
    const dir = makeFixture({
        'tsconfig.json': FIXTURE_TSCONFIG,
        'Widget/index.ts': `export interface WidgetProps {\n    label: string;\n}\n`,
    });
    try {
        const { fileToSubpaths, problems } = resolveBarrelsFromExports(
            {
                name: '@fixture/pkg',
                exports: {
                    './Widget': {
                        types: './dist/esm/Widget/index.d.ts',
                        import: './dist/esm/Widget/index.js',
                    },
                },
            },
            dir,
        );
        assert(problems.length === 0, `unexpected resolution problems: ${problems}`);
        const violations = findMissingDocs(dir, fileToSubpaths);
        assert(
            violations.some((v) => v.symbol === 'WidgetProps'),
            'expected WidgetProps (undocumented interface) to be flagged',
        );
        assert(
            violations.some((v) => v.symbol === 'WidgetProps.label'),
            'expected WidgetProps.label (undocumented member) to be flagged',
        );
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

function selfTestDocumentedPasses() {
    const dir = makeFixture({
        'tsconfig.json': FIXTURE_TSCONFIG,
        'Widget/index.ts':
            '/** Props for the Widget. */\nexport interface WidgetProps {\n    /** The label. */\n    label: string;\n}\n',
    });
    try {
        const { fileToSubpaths } = resolveBarrelsFromExports(
            {
                name: '@fixture/pkg',
                exports: {
                    './Widget': {
                        types: './dist/esm/Widget/index.d.ts',
                        import: './dist/esm/Widget/index.js',
                    },
                },
            },
            dir,
        );
        const violations = findMissingDocs(dir, fileToSubpaths);
        assert(
            violations.length === 0,
            `expected no violations for a fully documented barrel, got: ${JSON.stringify(violations)}`,
        );
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

function selfTestUnreachableLocalExportIsIgnored() {
    const dir = makeFixture({
        'tsconfig.json': FIXTURE_TSCONFIG,
        'Widget/index.ts':
            "/** Props for the Widget. */\nexport interface WidgetProps {\n    /** The label. */\n    label: string;\n}\nexport { formatLabel } from './internal';\n",
        'Widget/internal.ts':
            '// No barrel re-exports this - relative-import-only helper.\nexport const helperNeverReExported = (x: string): string => x;\n',
    });
    try {
        const { fileToSubpaths } = resolveBarrelsFromExports(
            {
                name: '@fixture/pkg',
                exports: {
                    './Widget': {
                        types: './dist/esm/Widget/index.d.ts',
                        import: './dist/esm/Widget/index.js',
                    },
                },
            },
            dir,
        );
        const violations = findMissingDocs(dir, fileToSubpaths);
        assert(
            !violations.some((v) => v.symbol === 'helperNeverReExported'),
            'a helper not re-exported by any barrel must never be flagged',
        );
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

function selfTestNamespaceReExportIsFollowedAndDeduped() {
    const dir = makeFixture({
        'tsconfig.json': FIXTURE_TSCONFIG,
        'index.ts':
            "import * as Widget from './Widget';\nexport { Widget };\n",
        'Widget/index.ts': 'export interface WidgetProps {\n    label: string;\n}\n',
    });
    try {
        const { fileToSubpaths } = resolveBarrelsFromExports(
            {
                name: '@fixture/pkg',
                exports: {
                    '.': {
                        types: './dist/esm/index.d.ts',
                        import: './dist/esm/index.js',
                    },
                    './Widget': {
                        types: './dist/esm/Widget/index.d.ts',
                        import: './dist/esm/Widget/index.js',
                    },
                },
            },
            dir,
        );
        const violations = findMissingDocs(dir, fileToSubpaths);
        const widgetPropsViolations = violations.filter(
            (v) => v.symbol === 'WidgetProps' || v.symbol === 'Widget.WidgetProps',
        );
        assert(
            widgetPropsViolations.length === 1,
            `expected the namespace re-export to be followed and deduplicated with the direct subpath, got ${widgetPropsViolations.length}: ${JSON.stringify(widgetPropsViolations)}`,
        );
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

const SELF_TESTS = [
    ['flags an undocumented interface and member', selfTestUndocumentedIsFlagged],
    ['passes a fully documented barrel', selfTestDocumentedPasses],
    ['ignores an unreachable local export', selfTestUnreachableLocalExportIsIgnored],
    [
        'follows and dedupes a namespace re-export',
        selfTestNamespaceReExportIsFollowedAndDeduped,
    ],
];

function runSelfTests() {
    let failures = 0;
    for (const [name, test] of SELF_TESTS) {
        try {
            test();
            console.log(`  ok - ${name}`);
        } catch (error) {
            failures++;
            console.error(`  FAIL - ${name}`);
            console.error(`    ${error instanceof Error ? error.message : error}`);
        }
    }
    return failures === 0;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

/** Reads and parses Source/package.json, exiting with an actionable message on failure. */
function readPackageManifest() {
    const pkgPath = path.join(packageDir, 'package.json');
    let raw;
    try {
        raw = readFileSync(pkgPath, 'utf8');
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error(`Could not read ${pkgPath}: ${detail}`);
        process.exit(1);
    }
    try {
        return JSON.parse(raw);
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error(`Could not parse ${pkgPath} as JSON: ${detail}`);
        process.exit(1);
    }
}

/** Runs the real reachable-exports doc check and exits non-zero on any finding. */
function runRealCheck() {
    const pkg = readPackageManifest();
    const { fileToSubpaths, problems } = resolveBarrelsFromExports(pkg, packageDir);

    if (problems.length > 0) {
        console.error('Could not resolve every exports map entry to a source file:');
        for (const problem of problems) console.error(`  - ${problem}`);
        process.exit(1);
    }

    console.log(
        `Checking ${fileToSubpaths.size} barrel(s) covering ${[...fileToSubpaths.values()].flat().length} JS export subpath(s) for missing TSDoc...\n`,
    );

    const violations = findMissingDocs(packageDir, fileToSubpaths);

    if (violations.length === 0) {
        console.log('Every reachable public declaration and member has a TSDoc comment.');
        return;
    }

    console.error(`${violations.length} public API doc gap(s) found:\n`);
    for (const violation of violations) {
        console.error(`  ${violation.file}:${violation.line}  ${violation.symbol}`);
        console.error(`    ${violation.reason}`);
        console.error(`    reachable via: ${violation.subpaths.join(', ')}`);
    }
    console.error(
        '\nAdd a TSDoc comment (defaults, units, ownership, callback timing, accessibility, etc. as relevant) to each symbol above.',
    );
    process.exit(1);
}

function main() {
    const args = new Set(process.argv.slice(2));

    if (!args.has('--skip-self-test')) {
        console.log('Running verify-api-docs self-tests...');
        const selfTestsPassed = runSelfTests();
        if (!selfTestsPassed) {
            console.error(
                '\nSelf-tests failed - refusing to trust the reachability/doc-presence walk. Fix the script before relying on its findings.',
            );
            process.exit(1);
        }
        console.log('Self-tests passed.\n');
    }

    if (args.has('--self-test-only')) {
        return;
    }

    runRealCheck();
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
    main();
}
