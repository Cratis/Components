// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import ts from 'typescript';
import {
    packageName as defaultPackageName,
    namespaceSubpaths,
    approvedRootSymbols,
} from './namespaceMap.js';

/**
 * Rewrites static imports of the `@cratis/components` root barrel into subpath
 * namespace imports, using the TypeScript compiler API for exact, position-based text
 * edits rather than a full reprint — every untouched line of the file, including
 * comments and formatting, is left byte-identical.
 *
 * What it does:
 * - `import { Canvas } from '@cratis/components'` becomes
 *   `import * as Canvas from '@cratis/components/Canvas'`.
 * - `import type { Canvas } from '@cratis/components'` becomes
 *   `import type * as Canvas from '@cratis/components/Canvas'`; a per-specifier
 *   `type` modifier (`import { type Canvas } from ...`) is honored the same way.
 * - Aliases are preserved: `import { Canvas as C } from '@cratis/components'` becomes
 *   `import * as C from '@cratis/components/Canvas'`.
 * - A mixed import naming both an approved setup symbol and a namespace is split: the
 *   setup symbol stays imported from the root, each namespace becomes its own subpath
 *   import.
 * - An import naming several namespaces produces one subpath import per namespace, in
 *   their original left-to-right order.
 * - Applying the codemod again is a no-op: it only ever matches an import whose
 *   module specifier is exactly the configured package name, so an already-migrated
 *   subpath import is never revisited.
 *
 * What it deliberately refuses to guess, reporting a diagnostic instead of editing:
 * - A namespace import of the whole package (`import * as Components from '...'`) —
 *   which subpath each later `Components.X` access belongs to cannot be determined
 *   from the import alone.
 * - A default import (`import Components from '...'`) — the package has no default
 *   export.
 * - A side-effect-only import (`import '...'`) — there is no binding to infer a
 *   subpath from.
 * - A named import of a symbol that is neither an approved setup symbol nor a known
 *   namespace — the whole import statement is left untouched so a partial, silently
 *   incomplete migration is never produced.
 * - A dynamic `import('...')` or CommonJS `require('...')` call anywhere in the file.
 * - Any `export ... from '@cratis/components'` re-export form — this codemod only
 *   rewrites `import` declarations.
 *
 * @param {string} fileName - Used only to select the TypeScript/TSX/JS/JSX grammar.
 * @param {string} text - The source file's current contents.
 * @param {{ packageName?: string }} [options]
 * @returns {{ text: string, changed: boolean, diagnostics: Array<{ file: string, line: number, column: number, message: string }> }}
 */
export function transformSource(fileName, text, options = {}) {
    const packageName = options.packageName ?? defaultPackageName;
    const sourceFile = ts.createSourceFile(
        fileName,
        text,
        ts.ScriptTarget.Latest,
        true,
        scriptKindFor(fileName),
    );

    const diagnostics = [];
    const edits = [];

    const isRootSpecifier = (moduleSpecifier) =>
        !!moduleSpecifier &&
        ts.isStringLiteral(moduleSpecifier) &&
        moduleSpecifier.text === packageName;

    const report = (node, message) => {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile),
        );
        diagnostics.push({
            file: fileName,
            line: line + 1,
            column: character + 1,
            message,
        });
    };

    const handleImport = (node) => {
        if (!isRootSpecifier(node.moduleSpecifier)) return;

        const importClause = node.importClause;
        if (!importClause) {
            report(
                node,
                `Side-effect-only import of '${packageName}' cannot be auto-migrated: there is no named binding to infer a subpath from. Import the specific subpath directly, or remove the import if it has no effect.`,
            );
            return;
        }
        if (importClause.name) {
            report(
                node,
                `Default import of '${packageName}' cannot be auto-migrated: the package has no default export. Replace it with the subpath import(s) it actually needs.`,
            );
            return;
        }

        const bindings = importClause.namedBindings;
        if (!bindings || !ts.isNamedImports(bindings)) {
            report(
                node,
                `Namespace import of '${packageName}' cannot be auto-migrated: which subpath each later member access belongs to cannot be inferred from the import alone. Replace it with the specific namespace subpath import(s) it needs.`,
            );
            return;
        }

        const declTypeOnly = importClause.isTypeOnly;
        const kept = [];
        const namespaced = [];
        let hasUnknown = false;

        for (const element of bindings.elements) {
            const importedName = (element.propertyName ?? element.name).text;
            const localName = element.name.text;

            if (approvedRootSymbols.has(importedName)) {
                kept.push({
                    importedName,
                    localName,
                    elementTypeOnly: element.isTypeOnly,
                });
                continue;
            }
            if (Object.hasOwn(namespaceSubpaths, importedName)) {
                namespaced.push({
                    localName,
                    subpath: namespaceSubpaths[importedName],
                    typeOnly: declTypeOnly || element.isTypeOnly,
                });
                continue;
            }

            hasUnknown = true;
            report(
                element,
                `'${importedName}' is not a recognized '${packageName}' root export (neither an approved setup symbol nor a known namespace). Leaving this import untouched — add '${importedName}' to the migration map, or migrate it by hand.`,
            );
        }

        // Never guess: an unrecognized specifier means the whole statement is left as-is,
        // even for the specifiers this codemod does recognize.
        if (hasUnknown) return;
        // Nothing to migrate — the import already only names approved root symbols.
        if (namespaced.length === 0) return;

        const replacement = buildReplacementText({
            packageName,
            declTypeOnly,
            kept,
            namespaced,
        });
        edits.push({ start: node.getStart(sourceFile), end: node.getEnd(), replacement });
    };

    const handleExport = (node) => {
        if (!isRootSpecifier(node.moduleSpecifier)) return;

        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
            for (const element of node.exportClause.elements) {
                const exportedName = (element.propertyName ?? element.name).text;
                if (approvedRootSymbols.has(exportedName)) continue;
                if (
                    Object.hasOwn(namespaceSubpaths, exportedName)
                ) {
                    report(
                        element,
                        `Re-export '${exportedName}' from '${packageName}/${namespaceSubpaths[exportedName]}' instead of the package root barrel. This codemod only rewrites 'import' declarations — split this 'export … from' by hand (e.g. 'export * as ${exportedName} from ${JSON.stringify(`${packageName}/${namespaceSubpaths[exportedName]}`)}').`,
                    );
                    continue;
                }
                report(
                    element,
                    `'${exportedName}' is not a recognized '${packageName}' root export; migrate this re-export by hand.`,
                );
            }
            return;
        }

        report(
            node,
            `A wildcard 're-export … from ${JSON.stringify(packageName)}' cannot be auto-migrated: this codemod only rewrites 'import' declarations. Replace it with explicit subpath re-exports.`,
        );
    };

    const checkCallExpression = (node) => {
        const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
        const isRequire =
            ts.isIdentifier(node.expression) && node.expression.text === 'require';
        if (!isDynamicImport && !isRequire) return;

        const [arg] = node.arguments;
        if (arg && ts.isStringLiteral(arg) && arg.text === packageName) {
            const form = isDynamicImport
                ? "dynamic 'import(...)'"
                : "CommonJS 'require(...)'";
            report(
                node,
                `A ${form} of '${packageName}' cannot be auto-migrated: this codemod only rewrites static 'import' declarations. Replace it with the specific subpath import(s) it needs.`,
            );
        }
    };

    const visit = (node) => {
        if (ts.isImportDeclaration(node)) {
            handleImport(node);
            return;
        }
        if (ts.isExportDeclaration(node)) {
            handleExport(node);
            return;
        }
        if (ts.isCallExpression(node)) {
            checkCallExpression(node);
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);

    if (edits.length === 0) {
        return { text, changed: false, diagnostics };
    }

    edits.sort((a, b) => a.start - b.start);
    let output = text;
    for (let i = edits.length - 1; i >= 0; i--) {
        const { start, end, replacement } = edits[i];
        output = output.slice(0, start) + replacement + output.slice(end);
    }

    return { text: output, changed: true, diagnostics };
}

function buildReplacementText({ packageName, declTypeOnly, kept, namespaced }) {
    const lines = [];

    if (kept.length > 0) {
        const specifiers = kept
            .map(({ importedName, localName, elementTypeOnly }) => {
                const prefix = !declTypeOnly && elementTypeOnly ? 'type ' : '';
                const alias = localName === importedName ? '' : ` as ${localName}`;
                return `${prefix}${importedName}${alias}`;
            })
            .join(', ');
        lines.push(
            `import ${declTypeOnly ? 'type ' : ''}{ ${specifiers} } from '${packageName}';`,
        );
    }

    for (const { localName, subpath, typeOnly } of namespaced) {
        lines.push(
            `import ${typeOnly ? 'type ' : ''}* as ${localName} from '${packageName}/${subpath}';`,
        );
    }

    return lines.join('\n');
}

function scriptKindFor(fileName) {
    if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX;
    if (fileName.endsWith('.jsx')) return ts.ScriptKind.JSX;
    if (fileName.endsWith('.mts') || fileName.endsWith('.cts')) return ts.ScriptKind.TS;
    if (
        fileName.endsWith('.js') ||
        fileName.endsWith('.mjs') ||
        fileName.endsWith('.cjs')
    )
        return ts.ScriptKind.JS;
    return ts.ScriptKind.TS;
}
