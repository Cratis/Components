// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import {
    dynamicPartExpressions,
    dynamicTestSelectors,
    generatedPartsSource,
    partDefinitions,
    resolvedParts,
    resolvedPtKeys,
} from './generate-parts.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedPath = path.join(sourceRoot, 'types', 'parts.ts');

const normalizePath = (file) => path.relative(sourceRoot, file).split(path.sep).join('/');
const sorted = (values) => [...values].sort((left, right) => left.localeCompare(right));
const sameValues = (left, right) =>
    left.length === right.length && left.every((value, index) => value === right[index]);

const collectTsx = (directory, files = []) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (['dist', 'node_modules', '.storybook', 'storybook-static'].includes(entry.name))
            continue;
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) collectTsx(absolute, files);
        else if (entry.isFile() && entry.name.endsWith('.tsx')) files.push(absolute);
    }
    return files;
};

const isTestFile = (relative) =>
    relative.split('/').some((segment) => segment.startsWith('for_')) ||
    /(?:^|\/)given\.tsx$/u.test(relative);
const isStoryFile = (relative) => relative.includes('.stories.');
const isProductionFile = (relative) => !isTestFile(relative) && !isStoryFile(relative);

const ownersBySource = () => {
    const owners = new Map();
    for (const [component, definition] of Object.entries(partDefinitions)) {
        for (const source of definition.sources ?? []) {
            const sourceOwners = owners.get(source) ?? [];
            sourceOwners.push(component);
            owners.set(source, sourceOwners);
        }
    }
    return owners;
};

const resolvedEmissionSources = (component, seen = new Set()) => {
    const definition = partDefinitions[component];
    if (!definition) return [];
    if (seen.has(component)) return [];
    const own = definition.sources ?? [];
    if (!definition.aliasOf) return own;
    return [
        ...own,
        ...resolvedEmissionSources(definition.aliasOf, new Set(seen).add(component)),
    ];
};

const dynamicProductionMap = new Map(
    dynamicPartExpressions.map((entry) => [`${entry.file}\0${entry.expression}`, entry]),
);

function readProductionEmissions() {
    const emissions = new Map();
    const problems = [];
    const owners = ownersBySource();
    const seenDynamic = new Set();

    for (const file of collectTsx(sourceRoot)) {
        const relative = normalizePath(file);
        if (!isProductionFile(relative)) continue;
        const sourceText = readFileSync(file, 'utf8');
        const sourceFile = ts.createSourceFile(
            file,
            sourceText,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TSX,
        );
        const fileOwners = owners.get(relative) ?? [];

        const record = (part, node) => {
            if (fileOwners.length === 0) {
                const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
                problems.push(
                    `${relative}:${line} emits '${part}' but has no owning component in generate-parts.mjs.`,
                );
                return;
            }
            for (const owner of fileOwners) {
                const values = emissions.get(owner) ?? new Set();
                values.add(part);
                emissions.set(owner, values);
            }
        };

        const recordDynamic = (expression, node) => {
            const key = `${relative}\0${expression}`;
            const allowlist = dynamicProductionMap.get(key);
            const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            if (!allowlist) {
                problems.push(
                    `${relative}:${line} has unproven dynamic data-cratis-part expression '${expression}'. Add an exact mapping to dynamicPartExpressions in generate-parts.mjs.`,
                );
                return;
            }
            seenDynamic.add(key);
            for (const part of allowlist.parts) record(part, node);
        };

        const visit = (node) => {
            if (ts.isJsxAttribute(node) && node.name.text === 'data-cratis-part') {
                const initializer = node.initializer;
                if (initializer && ts.isStringLiteral(initializer)) {
                    record(initializer.text, node);
                } else if (
                    initializer &&
                    ts.isJsxExpression(initializer) &&
                    initializer.expression
                ) {
                    if (ts.isStringLiteral(initializer.expression))
                        record(initializer.expression.text, node);
                    else recordDynamic(initializer.expression.getText(sourceFile), node);
                } else {
                    recordDynamic('<missing initializer>', node);
                }
            }

            if (ts.isPropertyAssignment(node)) {
                const name = node.name;
                const isPartProperty =
                    (ts.isStringLiteral(name) && name.text === 'data-cratis-part') ||
                    (ts.isIdentifier(name) && name.text === 'data-cratis-part');
                if (isPartProperty) {
                    if (ts.isStringLiteral(node.initializer))
                        record(node.initializer.text, node);
                    else recordDynamic(node.initializer.getText(sourceFile), node);
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
    }

    for (const [key, entry] of dynamicProductionMap) {
        if (!seenDynamic.has(key)) {
            problems.push(
                `Stale dynamic production mapping for ${entry.file}: '${entry.expression}'.`,
            );
        }
    }
    return { emissions, problems };
}

function compareComponentParts(component, manifestParts, emittedParts) {
    const problems = [];
    for (const part of manifestParts) {
        if (!emittedParts.has(part))
            problems.push(
                `${component} declares orphaned part '${part}' but neither it nor its alias target emits it.`,
            );
    }
    for (const part of emittedParts) {
        if (!manifestParts.includes(part))
            problems.push(`${component} emits missing manifest part '${part}'.`);
    }
    return problems;
}

function verifyDefinitions(emissions) {
    const problems = [];
    const owners = ownersBySource();
    const allParts = new Set();

    for (const [component, definition] of Object.entries(partDefinitions)) {
        const parts = resolvedParts(component);
        const duplicate = parts.find((part, index) => parts.indexOf(part) !== index);
        if (duplicate)
            problems.push(`${component} repeats manifest part '${duplicate}'.`);
        for (const part of parts) allParts.add(part);

        for (const source of definition.sources ?? []) {
            if (!owners.has(source)) problems.push(`${component} references unknown source ${source}.`);
        }

        const emitted = new Set();
        for (const sourceComponent of Object.keys(partDefinitions)) {
            const sourceFiles = resolvedEmissionSources(component);
            const candidateFiles = partDefinitions[sourceComponent].sources ?? [];
            if (candidateFiles.some((file) => sourceFiles.includes(file))) {
                for (const part of emissions.get(sourceComponent) ?? []) emitted.add(part);
            }
        }

        problems.push(...compareComponentParts(component, parts, emitted));
    }

    return { problems, allParts };
}

function buildProgram(files) {
    const configPath = path.join(sourceRoot, 'tsconfig.json');
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (configFile.error)
        throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, sourceRoot);
    return ts.createProgram({ rootNames: files, options: parsed.options });
}

function verifyPublicPtContracts() {
    const problems = [];
    const files = collectTsx(sourceRoot).filter((file) => isProductionFile(normalizePath(file)));
    const program = buildProgram(files);
    const checker = program.getTypeChecker();
    const owners = ownersBySource();
    const configuredPtFiles = new Map();
    for (const [component, definition] of Object.entries(partDefinitions)) {
        if (!definition.ptKeys && !definition.aliasOf) continue;
        for (const file of definition.ptFiles ?? definition.sources ?? [])
            configuredPtFiles.set(file, component);
    }

    const discoveredFiles = new Set();
    let declarationCount = 0;
    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.fileName.startsWith(sourceRoot) || !sourceFile.fileName.endsWith('.tsx'))
            continue;
        const relative = normalizePath(sourceFile.fileName);
        if (!isProductionFile(relative)) continue;
        const owner = configuredPtFiles.get(relative) ?? owners.get(relative)?.[0];

        const visit = (node) => {
            if (
                ts.isPropertySignature(node) &&
                node.questionToken &&
                ((ts.isIdentifier(node.name) && node.name.text === 'pt') ||
                    (ts.isStringLiteral(node.name) && node.name.text === 'pt'))
            ) {
                declarationCount++;
                discoveredFiles.add(relative);
                const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
                if (owner) {
                    const expected = sorted(resolvedPtKeys(owner));
                    const type = checker.getNonNullableType(checker.getTypeAtLocation(node));
                    const actual = sorted(checker.getPropertiesOfType(type).map((symbol) => symbol.name));
                    if (!sameValues(actual, expected)) {
                        problems.push(
                            `${relative}:${line} ${owner} pt keys differ: source=[${actual.join(', ')}], manifest=[${expected.join(', ')}].`,
                        );
                    }
                } else {
                    problems.push(`${relative}:${line} declares public pt without a manifest owner.`);
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
    }

    const expectedFiles = sorted(
        [...configuredPtFiles.keys()].filter((file) => {
            const absolute = path.join(sourceRoot, file);
            return readFileSync(absolute, 'utf8').includes('pt?:');
        }),
    );
    const actualFiles = sorted(discoveredFiles);
    if (!sameValues(actualFiles, expectedFiles)) {
        problems.push(
            `Public pt file inventory differs: source=[${actualFiles.join(', ')}], manifest=[${expectedFiles.join(', ')}].`,
        );
    }
    if (actualFiles.length !== 38 || declarationCount !== 41) {
        problems.push(
            `Expected the authoritative 38 pt files / 41 declarations, found ${actualFiles.length} files / ${declarationCount} declarations.`,
        );
    }
    return problems;
}

function verifyTestSelectors(allParts) {
    const problems = [];
    const dynamicMap = new Map(
        dynamicTestSelectors.map((entry) => [`${entry.file}\0${entry.expression}`, entry]),
    );
    const seenDynamic = new Set();
    const selectorPattern = /data-cratis-part\s*=\s*["']([^"']+)["']/gu;

    for (const file of collectTsx(sourceRoot)) {
        const relative = normalizePath(file);
        if (!isTestFile(relative)) continue;
        const sourceFile = ts.createSourceFile(
            file,
            readFileSync(file, 'utf8'),
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TSX,
        );
        const inspectText = (text, node) => {
            if (!text.includes('data-cratis-part')) return;
            if (text.includes('${')) {
                const key = `${relative}\0${text}`;
                const allowlist = dynamicMap.get(key);
                const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
                if (allowlist) {
                    seenDynamic.add(key);
                    for (const part of allowlist.parts) {
                        if (!allParts.has(part))
                            problems.push(
                                `${relative}:${line} dynamic selector maps unknown part '${part}'.`,
                            );
                    }
                } else {
                    problems.push(
                        `${relative}:${line} has unproven dynamic part selector '${text}'. Add an exact mapping to dynamicTestSelectors in generate-parts.mjs.`,
                    );
                }
                return;
            }
            for (const match of text.matchAll(selectorPattern)) {
                if (!allParts.has(match[1])) {
                    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
                    problems.push(
                        `${relative}:${line} selector references unknown part '${match[1]}'.`,
                    );
                }
            }
        };
        const visit = (node) => {
            if (
                ts.isStringLiteral(node) ||
                ts.isNoSubstitutionTemplateLiteral(node) ||
                ts.isRegularExpressionLiteral(node)
            ) inspectText(node.text, node);
            else if (ts.isTemplateExpression(node)) inspectText(node.getText(sourceFile).slice(1, -1), node);
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
    }

    for (const [key, entry] of dynamicMap) {
        if (!seenDynamic.has(key))
            problems.push(`Stale dynamic test-selector mapping for ${entry.file}: '${entry.expression}'.`);
    }
    return problems;
}

function verifyGeneratedFile() {
    const expected = generatedPartsSource();
    const actual = readFileSync(generatedPath, 'utf8');
    return actual === expected
        ? []
        : ['types/parts.ts is stale or was edited by hand. Run yarn generate-parts.'];
}

function runSelfTests() {
    const failures = [];
    const missing = compareComponentParts(
        'Widget',
        ['root'],
        new Set(['root', 'missing']),
    );
    if (!missing.some((problem) => problem.includes("missing manifest part 'missing'")))
        failures.push('planted missing source part was not detected');
    const orphaned = compareComponentParts(
        'Widget',
        ['root', 'orphaned'],
        new Set(['root']),
    );
    if (!orphaned.some((problem) => problem.includes("orphaned part 'orphaned'")))
        failures.push('planted orphaned manifest part was not detected');
    if (compareComponentParts('Widget', ['root'], new Set(['root'])).length !== 0)
        failures.push('matching fixture did not pass');
    return failures;
}

export function verifyPartsManifest() {
    const selfTestProblems = runSelfTests();
    if (selfTestProblems.length > 0)
        return selfTestProblems.map((problem) => `Self-test failed: ${problem}`);

    const { emissions, problems: emissionProblems } = readProductionEmissions();
    const { problems: definitionProblems, allParts } = verifyDefinitions(emissions);
    return [
        ...emissionProblems,
        ...definitionProblems,
        ...verifyPublicPtContracts(),
        ...verifyTestSelectors(allParts),
        ...verifyGeneratedFile(),
    ];
}

function main() {
    const selfTestOnly = process.argv.includes('--self-test-only');
    const selfTestProblems = runSelfTests();
    if (selfTestProblems.length > 0) {
        for (const problem of selfTestProblems) console.error(`verify-parts-manifest: ${problem}`);
        process.exit(1);
    }
    console.log('verify-parts-manifest self-tests passed (missing and orphaned fixtures).');
    if (selfTestOnly) return;

    const problems = verifyPartsManifest();
    if (problems.length > 0) {
        console.error(`verify-parts-manifest found ${problems.length} problem(s):`);
        for (const problem of problems) console.error(`  - ${problem}`);
        process.exit(1);
    }
    const componentCount = Object.keys(partDefinitions).length;
    const partCount = Object.keys(partDefinitions).reduce(
        (count, component) => count + resolvedParts(component).length,
        0,
    );
    console.log(
        `Parts manifest verified: ${componentCount} components, ${partCount} component parts, 38 pt files, and 41 pt declarations.`,
    );
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) main();
