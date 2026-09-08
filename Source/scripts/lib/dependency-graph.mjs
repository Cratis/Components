// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Shared helper for statically walking the *built* `dist/esm` module graph: parses every
 * `import`/`export … from`/dynamic-`import()`/`import type(...)` specifier in a compiled
 * `.js` or `.d.ts` file with the real TypeScript parser (no regex-on-source heuristics,
 * and no new dependency - `typescript` is already installed), then follows relative
 * specifiers to build a transitive closure while recording every external (bare)
 * specifier reached along the way.
 *
 * Used by both `verify-package-graph.mjs` (the full deterministic dependency-closure
 * check across every `exports` subpath) and `verify-no-pixi-consumer.mjs` (the narrower
 * "root's own closure never reaches Canvas/PivotViewer/pixi.js" assertion), so the two
 * checks can never quietly disagree about how a specifier resolves or what counts as
 * "external".
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {
    browserDomGlobals,
    isKernelReactSpecifier,
} from '../../../ESLint/lib/kernelBoundary.js';

/** Module-specifier string literals from every import/export/dynamic-import/import-type form. */
export function moduleSpecifiers(sourceFile) {
    const specifiers = [];
    const visit = (node) => {
        if (
            (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
            node.moduleSpecifier &&
            ts.isStringLiteralLike(node.moduleSpecifier)
        ) {
            specifiers.push(node.moduleSpecifier.text);
        } else if (
            ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword &&
            node.arguments.length === 1 &&
            ts.isStringLiteralLike(node.arguments[0])
        ) {
            specifiers.push(node.arguments[0].text);
        } else if (
            ts.isImportTypeNode(node) &&
            ts.isLiteralTypeNode(node.argument) &&
            ts.isStringLiteralLike(node.argument.literal)
        ) {
            specifiers.push(node.argument.literal.text);
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return specifiers;
}

/** Browser DOM global references in one emitted runtime or declaration source file. */
export function browserRuntimeReferences(sourceFile) {
    const forbidden = new Set(browserDomGlobals);
    const references = new Set();

    const isReference = (node) => {
        const parent = node.parent;
        if (!parent) return false;
        if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false;
        if (ts.isPropertyAssignment(parent) && parent.name === node) return false;
        if (ts.isMethodDeclaration(parent) && parent.name === node) return false;
        if (ts.isPropertyDeclaration(parent) && parent.name === node) return false;
        if (ts.isVariableDeclaration(parent) && parent.name === node) return false;
        if (ts.isParameter(parent) && parent.name === node) return false;
        if (ts.isFunctionDeclaration(parent) && parent.name === node) return false;
        if (ts.isClassDeclaration(parent) && parent.name === node) return false;
        if (
            ts.isImportClause(parent) ||
            ts.isImportSpecifier(parent) ||
            ts.isNamespaceImport(parent) ||
            ts.isExportSpecifier(parent)
        ) {
            return false;
        }
        return true;
    };

    const visit = (node) => {
        if (ts.isIdentifier(node) && forbidden.has(node.text) && isReference(node)) {
            references.add(node.text);
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return [...references].sort();
}

/** Classifies one declared kernel module's emitted runtime and declaration closures. */
export function analyzeKernelBoundary(
    runtimeClosure,
    declarationClosure,
    browserRuntimeEdges = [],
    browserDeclarationEdges = [],
) {
    const runtimeReactDependencies = [
        ...new Set(runtimeClosure.external.filter(isKernelReactSpecifier)),
    ].sort();
    const declarationReactDependencies = [
        ...new Set(declarationClosure.external.filter(isKernelReactSpecifier)),
    ].sort();
    const byFileAndName = (left, right) =>
        `${left.file}:${left.name}`.localeCompare(`${right.file}:${right.name}`);
    const normalizedBrowserRuntimeEdges = [...browserRuntimeEdges].sort(byFileAndName);
    const normalizedBrowserDeclarationEdges = [...browserDeclarationEdges].sort(
        byFileAndName,
    );
    const violations = [];

    if (runtimeReactDependencies.length > 0) {
        violations.push(
            `runtime closure reaches React dependencies: ${runtimeReactDependencies.join(', ')}`,
        );
    }
    if (declarationReactDependencies.length > 0) {
        violations.push(
            `declaration closure reaches React dependencies: ${declarationReactDependencies.join(', ')}`,
        );
    }
    if (normalizedBrowserRuntimeEdges.length > 0) {
        violations.push(
            'runtime closure reaches browser DOM globals: ' +
                normalizedBrowserRuntimeEdges
                    .map(({ file, name }) => `${file}:${name}`)
                    .join(', '),
        );
    }
    if (normalizedBrowserDeclarationEdges.length > 0) {
        violations.push(
            'declaration closure reaches browser DOM globals: ' +
                normalizedBrowserDeclarationEdges
                    .map(({ file, name }) => `${file}:${name}`)
                    .join(', '),
        );
    }

    return {
        runtimeReactDependencies,
        declarationReactDependencies,
        browserRuntimeEdges: normalizedBrowserRuntimeEdges,
        browserDeclarationEdges: normalizedBrowserDeclarationEdges,
        violations,
    };
}

/** Parses one emitted `.js`/`.d.ts` file's own specifiers (does not recurse). */
function specifiersOf(file) {
    const source = readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith('.d.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS,
    );
    return moduleSpecifiers(sourceFile);
}

/** Resolves a relative specifier from `fromFile` to the emitted file it points at, if any. */
function resolveRelative(fromFile, specifier) {
    if (!specifier.startsWith('.')) return undefined;
    const target = path.resolve(path.dirname(fromFile), specifier);
    if (existsSync(target) && !target.endsWith('/')) return target;
    if (existsSync(`${target}`) && path.extname(target) !== '') return target;
    return undefined;
}

/**
 * Walks the transitive closure of relative specifiers starting at `entryFile`.
 *
 * @param entryFile Absolute path to an emitted `.js` or `.d.ts` file.
 * @param root Absolute path to the root all reported `files` are made relative to (the `dist/esm` directory).
 * @returns `files` - every visited emitted file (relative to `root`, entry included); `external` - every
 *          non-relative (bare) specifier reached anywhere in the closure.
 */
export function closureOf(entryFile, root) {
    const files = new Set();
    const external = new Set();
    const queue = [entryFile];

    while (queue.length > 0) {
        const file = queue.pop();
        if (files.has(file)) continue;
        if (!existsSync(file)) continue;
        files.add(file);

        for (const specifier of specifiersOf(file)) {
            if (specifier.startsWith('.')) {
                const resolved = resolveRelative(file, specifier);
                if (resolved && !files.has(resolved)) queue.push(resolved);
            } else {
                external.add(specifier);
            }
        }
    }

    return {
        files: [...files].map((file) =>
            path.relative(root, file).split(path.sep).join('/'),
        ),
        external: [...external].sort(),
    };
}

/** True when `specifier` names `pixi.js` itself or one of its own subpaths. */
export const isPixiSpecifier = (specifier) =>
    specifier === 'pixi.js' || specifier.startsWith('pixi.js/');

/** True when `specifier` names a renderer vendor package forbidden from Components Core. */
export const isRendererVendorSpecifier = (specifier) =>
    specifier.startsWith('@mui/') ||
    specifier.startsWith('@emotion/') ||
    specifier === 'primereact' ||
    specifier.startsWith('primereact/') ||
    specifier.startsWith('@primereact/') ||
    specifier.startsWith('@primeuix/');

/** True for the React framework runtime imports required by renderer hooks and scopes. */
export const isRendererFrameworkRuntimeSpecifier = (specifier) =>
    specifier === 'react' || specifier === 'react/jsx-runtime';

/**
 * Classifies the renderer export's runtime and declaration closures without reading the file system.
 * Runtime code may depend only on the React framework peer, never vendor packages or component
 * implementations. Declarations may refer to Components-owned prop declarations and React types,
 * but never renderer-vendor types.
 */
export function analyzeRendererBoundary(
    runtimeClosure,
    declarationClosure,
    componentImplementationDirectories,
) {
    const runtimeExternalDependencies = [
        ...new Set(
            runtimeClosure.external.filter(
                (specifier) => !isRendererFrameworkRuntimeSpecifier(specifier),
            ),
        ),
    ].sort();
    const runtimeComponentImplementationFiles = [
        ...new Set(
            runtimeClosure.files.filter((file) =>
                componentImplementationDirectories.some((directory) =>
                    file.startsWith(`${directory}/`),
                ),
            ),
        ),
    ].sort();
    const declarationVendorDependencies = [
        ...new Set(declarationClosure.external.filter(isRendererVendorSpecifier)),
    ].sort();
    const violations = [];

    if (runtimeExternalDependencies.length > 0) {
        violations.push(
            `runtime closure reaches external dependencies: ${runtimeExternalDependencies.join(', ')}`,
        );
    }
    if (runtimeComponentImplementationFiles.length > 0) {
        violations.push(
            'runtime closure reaches component implementation files: ' +
                runtimeComponentImplementationFiles.join(', '),
        );
    }
    if (declarationVendorDependencies.length > 0) {
        violations.push(
            `declaration closure reaches renderer-vendor types: ${declarationVendorDependencies.join(', ')}`,
        );
    }

    return {
        runtimeExternalDependencies,
        runtimeComponentImplementationFiles,
        declarationVendorDependencies,
        violations,
    };
}

/** Produces the stable machine-report shape for an optional `./renderer` export. */
export function rendererBoundaryReport(
    rendererSubpath,
    componentImplementationDirectories,
) {
    if (!rendererSubpath) {
        return {
            status: 'deferred',
            reason: "The './renderer' export is not present.",
            componentImplementationDirectories,
            runtimeExternalDependencies: [],
            runtimeComponentImplementationFiles: [],
            declarationVendorDependencies: [],
            violations: [],
        };
    }

    const result = analyzeRendererBoundary(
        rendererSubpath.runtime,
        rendererSubpath.declarations,
        componentImplementationDirectories,
    );
    return {
        status: result.violations.length === 0 ? 'passed' : 'failed',
        reason: '',
        componentImplementationDirectories,
        ...result,
    };
}

/** True when a closure's `files` list contains a module under `Canvas/` or `PivotViewer/`. */
export const closureTouchesSpatialDirectory = (files) =>
    files.some(
        (file) =>
            (file.startsWith('Canvas/') || file.startsWith('PivotViewer/')) &&
            !file.startsWith('CanvasStyles'),
    );
