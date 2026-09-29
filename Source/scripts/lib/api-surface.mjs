// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { typeOnlyStarExports } from './star-exports.mjs';

/**
 * The typed JavaScript subpaths a package publishes, with the declaration entry each resolves to.
 * @param {string} packageDir A directory containing package.json and its built declarations.
 * @returns {{ subpath: string, entry: string }[]} Sorted by subpath.
 */
export const typedSubpaths = (packageDir) => {
    const manifest = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
    const subpaths = [];
    for (const [subpath, target] of Object.entries(manifest.exports ?? {})) {
        // Stylesheets and JSON files published as they are carry no declarations.
        if (typeof target === 'string' && /\.(css|json)$/u.test(target)) continue;
        if (typeof target !== 'object' || target === null ||
            typeof target.types !== 'string' || typeof target.import !== 'string') {
            // A new export shape must not silently drop out of the snapshot.
            throw new Error(`The export '${subpath}' has a shape this check does not understand: ${JSON.stringify(target)}`);
        }
        subpaths.push({ subpath, entry: path.join(packageDir, target.types) });
    }
    return subpaths.sort((left, right) => ordinal(left.subpath, right.subpath));
};

// Ordinal comparison keeps the snapshot byte-identical across locales and ICU builds.
const ordinal = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed });

// A destructured parameter's binding names are an implementation detail of the component; its
// type already describes the contract. Print such parameters as `props` so adding a prop changes
// only the props type, not every component signature that destructures it.
const withoutBindingNames = (context) => (root) => {
    const visit = (node) => {
        if (ts.isParameter(node) && (ts.isObjectBindingPattern(node.name) || ts.isArrayBindingPattern(node.name))) {
            return ts.factory.updateParameterDeclaration(
                node, node.modifiers, node.dotDotDotToken, ts.factory.createIdentifier('props'),
                node.questionToken, node.type, node.initializer,
            );
        }
        return ts.visitEachChild(node, visit, context);
    };
    return ts.visitNode(root, visit);
};

// Declarations are printed from the declaration files, so the text is what consumers compile
// against. Whitespace is normalized so formatting-only emit changes do not show up as API changes.
const declarationText = (declaration) => {
    const result = ts.transform(declaration, [withoutBindingNames]);
    try {
        return printer.printNode(ts.EmitHint.Unspecified, result.transformed[0], declaration.getSourceFile())
            .replace(/\s+/gu, ' ')
            .trim();
    } finally {
        result.dispose();
    }
};

// The alias declarations an export passes through before reaching its declaration.
const aliasChain = (checker, exported) => {
    const chain = [];
    const seen = new Set();
    for (let symbol = exported; symbol && symbol.flags & ts.SymbolFlags.Alias && !seen.has(symbol);) {
        seen.add(symbol);
        chain.push(...(symbol.declarations ?? []));
        symbol = checker.getImmediateAliasedSymbol(symbol);
    }
    return chain;
};

const moduleSpecifierOf = (declaration) => {
    if (ts.isExportSpecifier(declaration)) return declaration.parent.parent.moduleSpecifier;
    if (ts.isImportSpecifier(declaration)) return declaration.parent.parent.parent.moduleSpecifier;
    if (ts.isImportClause(declaration)) return declaration.parent.moduleSpecifier;
    if (ts.isNamespaceImport(declaration)) return declaration.parent.parent.moduleSpecifier;
    if (ts.isNamespaceExport(declaration)) return declaration.parent.moduleSpecifier;
    return undefined;
};

const importedNameOf = (declaration) => {
    if (ts.isExportSpecifier(declaration) || ts.isImportSpecifier(declaration)) {
        return (declaration.propertyName ?? declaration.name).text;
    }
    return ts.isImportClause(declaration) ? 'default' : '*';
};

// The first alias in the chain that names a bare package specifier: `package#name` and its index.
const externalSource = (chain) => {
    for (const [index, declaration] of chain.entries()) {
        const specifier = moduleSpecifierOf(declaration);
        if (specifier && ts.isStringLiteral(specifier) && !specifier.text.startsWith('.') && !path.isAbsolute(specifier.text)) {
            return { source: `${specifier.text}#${importedNameOf(declaration)}`, index };
        }
    }
    return undefined;
};

const isTypeOnlyAlias = (declaration) => ts.isTypeOnlyImportOrExportDeclaration(declaration);

// The installed package whose files declare an export, for declarations reached without an alias,
// such as through `export *`.
const installedPackageOf = (packageRoot, declarations) => {
    const names = declarations.map((declaration) => {
        const file = path.resolve(declaration.getSourceFile().fileName);
        const relative = path.relative(packageRoot, file).split(path.sep);
        const inside = relative[0] !== '..' && !path.isAbsolute(relative.join(path.sep));
        if (inside && !relative.includes('node_modules')) return undefined;
        const segments = file.split(path.sep);
        const index = segments.lastIndexOf('node_modules');
        if (index < 0) throw new Error(`An export is declared outside the package and outside node_modules: ${file}`);
        const scoped = segments[index + 1]?.startsWith('@');
        return segments.slice(index + 1, index + (scoped ? 3 : 2)).join('/');
    });
    return names.every((name) => name !== undefined) ? names[0] : undefined;
};

// Each export of a module with the text that describes it, sorted by name. A namespace re-export
// of an internal module is described member by member, so a member's change shows up too.
const describeModule = (checker, packageRoot, subpath, moduleSymbol, sourceFile, visiting) => {
    if (!moduleSymbol) return [];
    visiting.add(sourceFile);
    const starTypeOnly = typeOnlyStarExports(checker, sourceFile);
    const entries = checker.getExportsOfModule(moduleSymbol).map((exported) => {
        const name = exported.getName();
        const chain = aliasChain(checker, exported);
        // A name this module does not export itself arrives through `export *`.
        const throughStar = !(exported.declarations ?? []).some((declaration) => declaration.getSourceFile() === sourceFile);
        const starOnlyAsType = throughStar && starTypeOnly.get(name) === true;
        // A re-export of another package is recorded by the package and name it comes from,
        // judged only by this package's own aliases, so it reads the same whether or not that
        // package resolves here and whatever that package does internally.
        const external = externalSource(chain);
        if (external) {
            const typeOnly = starOnlyAsType || chain.slice(0, external.index + 1).some(isTypeOnlyAlias);
            return [name, `re-export of ${typeOnly ? 'type ' : ''}${external.source}`];
        }
        const typeOnly = starOnlyAsType || chain.some(isTypeOnlyAlias);
        const target = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
        const declarations = target.declarations ?? [];
        if (declarations.length === 0) {
            throw new Error(`The export '${subpath}#${name}' does not resolve to a declaration.`);
        }
        const installed = installedPackageOf(packageRoot, declarations);
        if (installed) return [name, `re-export of ${typeOnly ? 'type ' : ''}${installed}#${target.getName()}`];
        const moduleFile = declarations.find(ts.isSourceFile);
        let text;
        if (moduleFile) {
            const members = visiting.has(moduleFile)
                ? [['(cycle)', '']]
                : describeModule(checker, packageRoot, subpath, target, moduleFile, visiting);
            text = `namespace { ${members.map(([member, memberText]) => `${member}: ${memberText};`).join(' ')} }`;
        } else {
            text = declarations.map(declarationText).join(' | ');
        }
        // Exporting a value with `export type` removes the value for consumers.
        return [name, typeOnly && target.flags & ts.SymbolFlags.Value ? `(type-only) ${text}` : text];
    }).sort(([left], [right]) => ordinal(left, right));
    visiting.delete(sourceFile);
    return entries;
};

/**
 * Computes the exported API surface of every typed subpath: each export's name and the text of
 * the declarations it resolves to, with comments removed.
 * @param {string} packageDir A directory containing package.json and its built declarations.
 * @returns {Record<string, Record<string, string>>} Subpath to export name to declaration text, sorted.
 */
export const computeApiSurface = (packageDir) => {
    const subpaths = typedSubpaths(packageDir);
    const program = ts.createProgram(subpaths.map(({ entry }) => entry), {
        noEmit: true,
        skipLibCheck: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        jsx: ts.JsxEmit.ReactJSX,
    });
    const checker = program.getTypeChecker();
    const packageRoot = path.resolve(packageDir);
    const surface = {};
    for (const { subpath, entry } of subpaths) {
        const sourceFile = program.getSourceFile(entry);
        if (!sourceFile) throw new Error(`The declaration entry for '${subpath}' was not found: ${entry}`);
        const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
        surface[subpath] = Object.fromEntries(describeModule(checker, packageRoot, subpath, moduleSymbol, sourceFile, new Set()));
    }
    return surface;
};

/**
 * Compares two API surfaces.
 * @param {Record<string, Record<string, string>>} baseline The earlier surface.
 * @param {Record<string, Record<string, string>>} current The surface to compare.
 * @returns {{ removed: string[], changed: string[], added: string[] }} Qualified `subpath#export` names.
 */
export const compareApiSurfaces = (baseline, current) => {
    const removed = [];
    const changed = [];
    const added = [];
    const subpaths = [...new Set([...Object.keys(baseline), ...Object.keys(current)])].sort(ordinal);
    for (const subpath of subpaths) {
        const before = baseline[subpath];
        const after = current[subpath];
        if (!before) { added.push(`${subpath} (new subpath)`); continue; }
        if (!after) { removed.push(`${subpath} (subpath removed)`); continue; }
        for (const name of Object.keys(before)) {
            if (!(name in after)) removed.push(`${subpath}#${name}`);
            else if (before[name] !== after[name]) changed.push(`${subpath}#${name}`);
        }
        for (const name of Object.keys(after)) {
            if (!(name in before)) added.push(`${subpath}#${name}`);
        }
    }
    return { removed, changed, added };
};

/**
 * Serializes a surface deterministically.
 * @param {Record<string, Record<string, string>>} surface The surface.
 * @returns {string} JSON with a trailing newline.
 */
export const serializeApiSurface = (surface) => `${JSON.stringify(surface, null, 2)}\n`;
