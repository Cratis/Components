// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/**
 * The typed JavaScript subpaths a package publishes, with the declaration entry each resolves to.
 * @param {string} packageDir A directory containing package.json and its built declarations.
 * @returns {{ subpath: string, entry: string }[]} Sorted by subpath.
 */
export const typedSubpaths = (packageDir) => {
    const manifest = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
    const subpaths = [];
    for (const [subpath, target] of Object.entries(manifest.exports ?? {})) {
        // Stylesheets and JSON assets are not part of the typed API.
        const asset = typeof target === 'string' || subpath.endsWith('.json') || subpath.endsWith('.css') ||
            subpath.endsWith('/styles') || (typeof target === 'object' && target !== null && target.style !== undefined);
        if (asset) continue;
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
    const packageRoot = `${path.resolve(packageDir)}${path.sep}`;
    const surface = {};
    for (const { subpath, entry } of subpaths) {
        const sourceFile = program.getSourceFile(entry);
        if (!sourceFile) throw new Error(`The declaration entry for '${subpath}' was not found: ${entry}`);
        const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
        const exports = moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : [];
        const entries = exports.map((exported) => {
            const target = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
            const declarations = target.declarations ?? [];
            if (declarations.length === 0) {
                throw new Error(`The export '${subpath}#${exported.getName()}' does not resolve to a declaration.`);
            }
            // A re-export of another package's type is recorded by where it comes from; its text
            // depends on that package's installed version, not on this package.
            const external = declarations.every((declaration) =>
                !path.resolve(declaration.getSourceFile().fileName).startsWith(packageRoot) ||
                declaration.getSourceFile().fileName.includes(`${path.sep}node_modules${path.sep}`));
            const text = external
                ? `re-export of ${checker.getFullyQualifiedName(target)}`
                : declarations.map(declarationText).join(' | ');
            return [exported.getName(), text];
        }).sort(([left], [right]) => ordinal(left, right));
        surface[subpath] = Object.fromEntries(entries);
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
