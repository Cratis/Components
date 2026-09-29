// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import ts from 'typescript';

const isRelative = (specifier) => specifier.startsWith('.');

/**
 * Finds which names a module re-exports through `export *` only as types, because every
 * `export *` path that reaches them passes an `export type *`. Star exports create no alias
 * symbols, so the alias chain of such a name does not show that its value was withheld.
 * @param {ts.TypeChecker} checker The type checker.
 * @param {ts.SourceFile} sourceFile The module to inspect.
 * @returns {Map<string, boolean>} Name to whether it is reachable only as a type.
 */
export const typeOnlyStarExports = (checker, sourceFile) => collect(checker, sourceFile, false, new Set());

const collect = (checker, sourceFile, typeOnly, visiting) => {
    const result = new Map();
    if (visiting.has(sourceFile)) return result;
    visiting.add(sourceFile);
    const merge = (name, onlyAsType) => result.set(name, result.has(name) ? result.get(name) && onlyAsType : onlyAsType);
    for (const statement of sourceFile.statements) {
        if (!ts.isExportDeclaration(statement) || statement.exportClause || !statement.moduleSpecifier) continue;
        const moduleSymbol = checker.getSymbolAtLocation(statement.moduleSpecifier);
        if (!moduleSymbol) continue;
        const onlyAsType = typeOnly || statement.isTypeOnly;
        const target = moduleSymbol.declarations?.find(ts.isSourceFile);
        // A cycle adds no names that are not already reached another way.
        if (target && visiting.has(target)) continue;
        const internal = target && ts.isStringLiteral(statement.moduleSpecifier) && isRelative(statement.moduleSpecifier.text);
        // Names from deeper star exports of an internal module carry their own path's marking.
        const deeper = internal ? collect(checker, target, onlyAsType, visiting) : new Map();
        for (const exported of checker.getExportsOfModule(moduleSymbol)) {
            const name = exported.getName();
            // A name the target exports or declares itself shadows its own star exports.
            const ownExport = (exported.declarations ?? []).some((declaration) => declaration.getSourceFile() === target);
            merge(name, deeper.has(name) && !ownExport ? deeper.get(name) : onlyAsType);
        }
    }
    visiting.delete(sourceFile);
    return result;
};
