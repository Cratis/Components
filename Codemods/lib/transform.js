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
 * - A named re-export follows the same rules: `export { Canvas } from '@cratis/components'`
 *   becomes `export * as Canvas from '@cratis/components/Canvas'`, with the same alias,
 *   type-only, mixed-setup-symbol, and multiple-namespace handling as the import case.
 * - Applying the codemod again is a no-op: it only ever matches an import or named
 *   re-export whose module specifier is exactly the configured package name, so an
 *   already-migrated subpath import or re-export is never revisited.
 *
 * What it deliberately refuses to guess, reporting a diagnostic instead of editing:
 * - A namespace import of the whole package (`import * as Components from '...'`) —
 *   which subpath each later `Components.X` access belongs to cannot be determined
 *   from the import alone.
 * - A default import (`import Components from '...'`) — the package has no default
 *   export.
 * - A side-effect-only import (`import '...'`) — there is no binding to infer a
 *   subpath from.
 * - A named import or named re-export of a symbol that is neither an approved setup
 *   symbol nor a known namespace — the whole statement is left untouched so a
 *   partial, silently incomplete migration is never produced.
 * - A dynamic `import('...')` or CommonJS `require('...')` call anywhere in the file.
 * - A wildcard re-export of the whole package (`export * from '@cratis/components'`)
 *   or a namespace re-export of the whole package (`export * as X from
 *   '@cratis/components'`) — the same ambiguity as a whole-package namespace import:
 *   which subpath each later access belongs to cannot be determined from the
 *   re-export alone.
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
                    name: importedName,
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

        const replacement = buildSubpathReplacementText({
            keyword: 'import',
            packageName,
            declTypeOnly,
            kept,
            namespaced,
        });
        edits.push({ start: node.getStart(sourceFile), end: node.getEnd(), replacement });
    };

    const handleExport = (node) => {
        if (!isRootSpecifier(node.moduleSpecifier)) return;

        if (!node.exportClause || !ts.isNamedExports(node.exportClause)) {
            // A bare `export * from '@cratis/components'` or a namespace re-export
            // (`export * as X from '@cratis/components'`) is exactly as ambiguous as a
            // whole-package namespace import: there is no way to know, from the
            // re-export alone, which subpath a later consumer's member access needs.
            report(
                node,
                `A wildcard 're-export … from ${JSON.stringify(packageName)}' cannot be auto-migrated: which subpath each later member access belongs to cannot be inferred from the re-export alone. Replace it with explicit subpath re-export(s).`,
            );
            return;
        }

        const declTypeOnly = node.isTypeOnly;
        const kept = [];
        const namespaced = [];
        let hasUnknown = false;

        for (const element of node.exportClause.elements) {
            const exportedName = (element.propertyName ?? element.name).text;
            const localName = element.name.text;

            if (approvedRootSymbols.has(exportedName)) {
                kept.push({
                    name: exportedName,
                    localName,
                    elementTypeOnly: element.isTypeOnly,
                });
                continue;
            }
            if (Object.hasOwn(namespaceSubpaths, exportedName)) {
                namespaced.push({
                    localName,
                    subpath: namespaceSubpaths[exportedName],
                    typeOnly: declTypeOnly || element.isTypeOnly,
                });
                continue;
            }

            hasUnknown = true;
            report(
                element,
                `'${exportedName}' is not a recognized '${packageName}' root export (neither an approved setup symbol nor a known namespace). Leaving this re-export untouched — add '${exportedName}' to the migration map, or migrate it by hand.`,
            );
        }

        // Never guess: an unrecognized specifier means the whole statement is left as-is,
        // even for the specifiers this codemod does recognize.
        if (hasUnknown) return;
        // Nothing to migrate — the re-export already only names approved root symbols.
        if (namespaced.length === 0) return;

        const replacement = buildSubpathReplacementText({
            keyword: 'export',
            packageName,
            declTypeOnly,
            kept,
            namespaced,
        });
        edits.push({ start: node.getStart(sourceFile), end: node.getEnd(), replacement });
    };

    const handleImportEquals = (node) => {
        if (!ts.isExternalModuleReference(node.moduleReference)) return;
        if (!isRootSpecifier(node.moduleReference.expression)) return;

        report(
            node,
            `Import-assignment of '${packageName}' ('import ${node.name.text} = require(...)') cannot be auto-migrated: which subpath each later member access belongs to cannot be inferred from the import alone. Replace it with the specific namespace subpath import(s) it needs.`,
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
        if (ts.isImportEqualsDeclaration(node)) {
            handleImportEquals(node);
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

/**
 * Builds replacement source text for both the import and named-re-export cases, which
 * share an identical shape: an optional statement that keeps the approved root symbols
 * (`{ name, localName, elementTypeOnly }` entries), followed by one `* as localName from
 * '<package>/<subpath>'` statement per namespace (`{ localName, subpath, typeOnly }`
 * entries). `keyword` is `'import'` or `'export'`.
 */
function buildSubpathReplacementText({ keyword, packageName, declTypeOnly, kept, namespaced }) {
    const lines = [];

    if (kept.length > 0) {
        const specifiers = kept
            .map(({ name, localName, elementTypeOnly }) => {
                const prefix = !declTypeOnly && elementTypeOnly ? 'type ' : '';
                const alias = localName === name ? '' : ` as ${localName}`;
                return `${prefix}${name}${alias}`;
            })
            .join(', ');
        lines.push(
            `${keyword} ${declTypeOnly ? 'type ' : ''}{ ${specifiers} } from '${packageName}';`,
        );
    }

    for (const { localName, subpath, typeOnly } of namespaced) {
        lines.push(
            `${keyword} ${typeOnly ? 'type ' : ''}* as ${localName} from '${packageName}/${subpath}';`,
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
