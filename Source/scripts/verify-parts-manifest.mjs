// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import {
    canonicalPartStateNames,
    dynamicPartExpressions,
    dynamicTestSelectors,
    generatedPartsSource,
    implicitPartStateAllowlist,
    partDefinitions,
    partStateDefinitions,
    resolvedPartStates,
    resolvedParts,
    resolvedPtKeys,
    splitPartStateAllowlist,
} from './generate-parts.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedPath = path.join(sourceRoot, 'types', 'parts.ts');
const expectedCanonicalPartStateNames = [
    'disabled',
    'loading',
    'selected',
    'open',
    'invalid',
    'readonly',
    'busy',
    'focused',
    'pressed',
];
const canonicalPartStateNameSet = new Set(expectedCanonicalPartStateNames);

const normalizePath = (file) => path.relative(sourceRoot, file).split(path.sep).join('/');
const sorted = (values) => [...values].sort((left, right) => left.localeCompare(right));
const sameValues = (left, right) =>
    left.length === right.length && left.every((value, index) => value === right[index]);

const collectTsx = (directory, files = []) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (
            ['dist', 'node_modules', '.storybook', 'storybook-static'].includes(
                entry.name,
            )
        )
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
    if (!definition || seen.has(component)) return [];
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
const splitStateMap = new Map(
    splitPartStateAllowlist.map((entry) => [`${entry.file}\0${entry.spread}`, entry]),
);

const unwrapExpression = (expression) => {
    let current = expression;
    while (
        ts.isParenthesizedExpression(current) ||
        ts.isAsExpression(current) ||
        ts.isTypeAssertionExpression(current) ||
        ts.isNonNullExpression(current) ||
        ts.isSatisfiesExpression(current)
    )
        current = current.expression;
    return current;
};

const isUndefinedExpression = (expression) => {
    const current = unwrapExpression(expression);
    return (
        (ts.isIdentifier(current) && current.text === 'undefined') ||
        (ts.isVoidExpression(current) &&
            current.expression.kind === ts.SyntaxKind.NumericLiteral)
    );
};

const isTrueExpression = (expression) => {
    const current = unwrapExpression(expression);
    return (
        current.kind === ts.SyntaxKind.TrueKeyword ||
        (ts.isStringLiteral(current) && current.text === 'true')
    );
};

const isBooleanLikeType = (type) => {
    const types = type.isUnion() ? type.types : [type];
    return types.every(
        (candidate) =>
            (candidate.flags & ts.TypeFlags.BooleanLike) !== 0 ||
            (candidate.flags & ts.TypeFlags.Undefined) !== 0 ||
            (candidate.flags & ts.TypeFlags.Never) !== 0,
    );
};

const isFalseSafeStateExpression = (expression, checker) => {
    const current = unwrapExpression(expression);
    if (isTrueExpression(current)) return true;
    if (
        ts.isBinaryExpression(current) &&
        current.operatorToken.kind === ts.SyntaxKind.BarBarToken &&
        isUndefinedExpression(current.right)
    ) {
        const condition = unwrapExpression(current.left);
        if (ts.isStringLiteral(condition)) return condition.text === 'true';
        return !checker || isBooleanLikeType(checker.getTypeAtLocation(condition));
    }
    if (ts.isConditionalExpression(current)) {
        return (
            (isTrueExpression(current.whenTrue) &&
                isUndefinedExpression(current.whenFalse)) ||
            (isUndefinedExpression(current.whenTrue) &&
                isTrueExpression(current.whenFalse))
        );
    }
    return false;
};

function stateValueProblem(attribute, sourceFile, relative, checker) {
    if (!attribute.initializer) return undefined;
    const line = sourceFile.getLineAndCharacterOfPosition(attribute.getStart()).line + 1;
    if (ts.isStringLiteral(attribute.initializer)) {
        if (attribute.initializer.text === 'true') return undefined;
        return `${relative}:${line} ${attribute.name.text}='${attribute.initializer.text}' can serialize a non-true state; use bare true or a condition normalized to undefined.`;
    }
    if (
        ts.isJsxExpression(attribute.initializer) &&
        attribute.initializer.expression &&
        isFalseSafeStateExpression(attribute.initializer.expression, checker)
    )
        return undefined;
    return `${relative}:${line} ${attribute.name.text} can serialize false; use bare true or a condition normalized to undefined.`;
}

const getStateEmissions = (stateEmissions, owner, part) => {
    const ownerStates = stateEmissions.get(owner) ?? new Map();
    const states = ownerStates.get(part) ?? new Set();
    ownerStates.set(part, states);
    stateEmissions.set(owner, ownerStates);
    return states;
};

function readProductionEmissions() {
    const partEmissions = new Map();
    const stateEmissions = new Map();
    const problems = [];
    const owners = ownersBySource();
    const seenDynamic = new Set();
    const seenSplit = new Set();
    const productionFiles = collectTsx(sourceRoot).filter((file) =>
        isProductionFile(normalizePath(file)),
    );
    const program = buildProgram(productionFiles);
    const checker = program.getTypeChecker();

    for (const file of productionFiles) {
        const relative = normalizePath(file);
        const sourceFile = program.getSourceFile(file);
        if (!sourceFile) {
            problems.push(
                `${relative} could not be loaded into the TypeScript verifier program.`,
            );
            continue;
        }
        const fileOwners = owners.get(relative) ?? [];

        const recordPart = (part, node) => {
            if (fileOwners.length === 0) {
                const line =
                    sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
                problems.push(
                    `${relative}:${line} emits '${part}' but has no owning component in generate-parts.mjs.`,
                );
                return;
            }
            for (const owner of fileOwners) {
                const values = partEmissions.get(owner) ?? new Set();
                values.add(part);
                partEmissions.set(owner, values);
            }
        };

        const recordState = (part, state) => {
            for (const owner of fileOwners)
                getStateEmissions(stateEmissions, owner, part).add(state);
        };

        const dynamicParts = (expression, node) => {
            const key = `${relative}\0${expression}`;
            const allowlist = dynamicProductionMap.get(key);
            const line =
                sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            if (!allowlist) {
                problems.push(
                    `${relative}:${line} has unproven dynamic data-cratis-part expression '${expression}'. Add an exact mapping to dynamicPartExpressions in generate-parts.mjs.`,
                );
                return [];
            }
            seenDynamic.add(key);
            return allowlist.parts;
        };

        const literalOrDynamicParts = (attribute) => {
            const initializer = attribute.initializer;
            if (initializer && ts.isStringLiteral(initializer)) return [initializer.text];
            if (
                initializer &&
                ts.isJsxExpression(initializer) &&
                initializer.expression
            ) {
                if (ts.isStringLiteral(initializer.expression))
                    return [initializer.expression.text];
                return dynamicParts(
                    initializer.expression.getText(sourceFile),
                    attribute,
                );
            }
            return dynamicParts('<missing initializer>', attribute);
        };

        const inspectOpeningElement = (node) => {
            const attributes = node.attributes.properties;
            const partAttribute = attributes.find(
                (attribute) =>
                    ts.isJsxAttribute(attribute) &&
                    attribute.name.text === 'data-cratis-part',
            );
            const stateAttributes = attributes.filter(
                (attribute) =>
                    ts.isJsxAttribute(attribute) &&
                    typeof attribute.name.text === 'string' &&
                    attribute.name.text.startsWith('data-') &&
                    canonicalPartStateNameSet.has(attribute.name.text.slice(5)),
            );

            for (const attribute of stateAttributes) {
                const problem = stateValueProblem(
                    attribute,
                    sourceFile,
                    relative,
                    checker,
                );
                if (problem) problems.push(problem);
            }

            if (partAttribute && ts.isJsxAttribute(partAttribute)) {
                const parts = literalOrDynamicParts(partAttribute);
                for (const part of parts) {
                    recordPart(part, partAttribute);
                    for (const attribute of stateAttributes)
                        recordState(part, attribute.name.text.slice(5));
                }
                return;
            }

            if (stateAttributes.length === 0) return;
            const spreadExpressions = attributes
                .filter(ts.isJsxSpreadAttribute)
                .map((attribute) => attribute.expression.getText(sourceFile));
            const splitEntries = spreadExpressions
                .map((spread) => splitStateMap.get(`${relative}\0${spread}`))
                .filter(Boolean);
            if (splitEntries.length === 0) return;
            const line =
                sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            if (splitEntries.length > 1) {
                problems.push(
                    `${relative}:${line} matches more than one split part-state allowlist.`,
                );
                return;
            }
            const splitEntry = splitEntries[0];
            const key = `${splitEntry.file}\0${splitEntry.spread}`;
            seenSplit.add(key);
            const actualStates = sorted(
                new Set(stateAttributes.map((attribute) => attribute.name.text.slice(5))),
            );
            const expectedStates = sorted(splitEntry.states);
            if (!sameValues(actualStates, expectedStates)) {
                problems.push(
                    `${relative}:${line} split state allowlist for '${splitEntry.part}' differs: source=[${actualStates.join(', ')}], manifest=[${expectedStates.join(', ')}].`,
                );
            }
            recordPart(splitEntry.part, node);
            for (const state of actualStates) recordState(splitEntry.part, state);
        };

        const visit = (node) => {
            if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))
                inspectOpeningElement(node);

            if (ts.isPropertyAssignment(node)) {
                const name = node.name;
                const isPartProperty =
                    (ts.isStringLiteral(name) && name.text === 'data-cratis-part') ||
                    (ts.isIdentifier(name) && name.text === 'data-cratis-part');
                if (isPartProperty) {
                    const parts = ts.isStringLiteral(node.initializer)
                        ? [node.initializer.text]
                        : dynamicParts(node.initializer.getText(sourceFile), node);
                    for (const part of parts) recordPart(part, node);
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
    }

    const seenImplicitStates = new Set();
    for (const entry of implicitPartStateAllowlist) {
        const key = `${entry.component}\0${entry.part}`;
        if (seenImplicitStates.has(key)) {
            problems.push(
                `Duplicate implicit part-state mapping for ${entry.component}.${entry.part}.`,
            );
            continue;
        }
        seenImplicitStates.add(key);
        const definition = partDefinitions[entry.component];
        if (!definition) {
            problems.push(
                `Implicit part-state mapping references unknown component '${entry.component}'.`,
            );
            continue;
        }
        if (!resolvedParts(entry.component).includes(entry.part)) {
            problems.push(
                `Implicit part-state mapping references unknown part '${entry.component}.${entry.part}'.`,
            );
            continue;
        }
        if (!(owners.get(entry.file) ?? []).includes(entry.component)) {
            problems.push(
                `Implicit part-state mapping for ${entry.component}.${entry.part} references unowned source ${entry.file}.`,
            );
            continue;
        }
        for (const state of entry.states) {
            if (!canonicalPartStateNameSet.has(state)) {
                problems.push(
                    `Implicit part-state mapping for ${entry.component}.${entry.part} declares unknown canonical state '${state}'.`,
                );
                continue;
            }
            getStateEmissions(stateEmissions, entry.component, entry.part).add(state);
        }
    }

    for (const [key, entry] of dynamicProductionMap) {
        if (!seenDynamic.has(key))
            problems.push(
                `Stale dynamic production mapping for ${entry.file}: '${entry.expression}'.`,
            );
    }
    for (const [key, entry] of splitStateMap) {
        if (!seenSplit.has(key))
            problems.push(
                `Stale split part-state allowlist for ${entry.file}: '${entry.spread}'.`,
            );
    }
    return { partEmissions, stateEmissions, problems };
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

function validatePartStateDefinition(component, parts, statesByPart) {
    const problems = [];
    if (!statesByPart) return [`${component} has no explicit part-state definition.`];
    const expectedParts = sorted(parts);
    const actualParts = sorted(Object.keys(statesByPart));
    if (!sameValues(actualParts, expectedParts)) {
        problems.push(
            `${component} state part inventory differs: states=[${actualParts.join(', ')}], parts=[${expectedParts.join(', ')}].`,
        );
    }
    for (const [part, states] of Object.entries(statesByPart)) {
        const duplicate = states.find((state, index) => states.indexOf(state) !== index);
        if (duplicate)
            problems.push(`${component}.${part} repeats canonical state '${duplicate}'.`);
        for (const state of states) {
            if (!canonicalPartStateNameSet.has(state))
                problems.push(
                    `${component}.${part} declares unknown canonical state '${state}'.`,
                );
        }
    }
    return problems;
}

function compareComponentStates(component, manifestStates, emittedStates) {
    const problems = [];
    for (const [part, declaredStates] of Object.entries(manifestStates)) {
        const emitted = emittedStates.get(part) ?? new Set();
        for (const state of declaredStates) {
            if (!emitted.has(state))
                problems.push(
                    `${component}.${part} declares orphaned canonical state '${state}' but neither it nor its alias target emits it.`,
                );
        }
        for (const state of emitted) {
            if (!declaredStates.includes(state))
                problems.push(
                    `${component}.${part} emits undeclared canonical state '${state}'.`,
                );
        }
    }
    for (const [part, emitted] of emittedStates) {
        if (part in manifestStates) continue;
        for (const state of emitted)
            problems.push(
                `${component}.${part} emits canonical state '${state}' for an unknown part.`,
            );
    }
    return problems;
}

const aggregateEmissions = (component, emissions, emptyValue) => {
    const sourceFiles = resolvedEmissionSources(component);
    const aggregate = emptyValue();
    for (const [sourceComponent, definition] of Object.entries(partDefinitions)) {
        const candidateFiles = definition.sources ?? [];
        if (!candidateFiles.some((file) => sourceFiles.includes(file))) continue;
        const sourceEmission = emissions.get(sourceComponent);
        if (!sourceEmission) continue;
        if (aggregate instanceof Set) {
            for (const value of sourceEmission) aggregate.add(value);
        } else {
            for (const [part, states] of sourceEmission) {
                const values = aggregate.get(part) ?? new Set();
                for (const state of states) values.add(state);
                aggregate.set(part, values);
            }
        }
    }
    return aggregate;
};

function verifyDefinitions(partEmissions, stateEmissions) {
    const problems = [];
    const owners = ownersBySource();
    const allParts = new Set();

    if (!sameValues(canonicalPartStateNames, expectedCanonicalPartStateNames)) {
        problems.push(
            `Canonical part states must be exactly [${expectedCanonicalPartStateNames.join(', ')}], found [${canonicalPartStateNames.join(', ')}].`,
        );
    }

    for (const [component, definition] of Object.entries(partDefinitions)) {
        const parts = resolvedParts(component);
        const duplicate = parts.find((part, index) => parts.indexOf(part) !== index);
        if (duplicate)
            problems.push(`${component} repeats manifest part '${duplicate}'.`);
        for (const part of parts) allParts.add(part);

        for (const source of definition.sources ?? []) {
            if (!owners.has(source))
                problems.push(`${component} references unknown source ${source}.`);
        }

        if (definition.aliasOf) {
            if (component in partStateDefinitions)
                problems.push(
                    `${component} is an alias and must inherit, not redeclare, part states.`,
                );
        } else {
            problems.push(
                ...validatePartStateDefinition(
                    component,
                    parts,
                    partStateDefinitions[component],
                ),
            );
        }

        const emittedParts = aggregateEmissions(
            component,
            partEmissions,
            () => new Set(),
        );
        const emittedStates = aggregateEmissions(
            component,
            stateEmissions,
            () => new Map(),
        );
        problems.push(...compareComponentParts(component, parts, emittedParts));
        problems.push(
            ...compareComponentStates(
                component,
                resolvedPartStates(component),
                emittedStates,
            ),
        );
    }

    for (const component of Object.keys(partStateDefinitions)) {
        if (!(component in partDefinitions))
            problems.push(
                `Part-state definition references unknown component '${component}'.`,
            );
    }

    return { problems, allParts };
}

function buildProgram(files) {
    const configPath = path.join(sourceRoot, 'tsconfig.json');
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (configFile.error)
        throw new Error(
            ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'),
        );
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, sourceRoot);
    return ts.createProgram({ rootNames: files, options: parsed.options });
}

function verifyPublicPtContracts() {
    const problems = [];
    const files = collectTsx(sourceRoot).filter((file) =>
        isProductionFile(normalizePath(file)),
    );
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
        if (
            !sourceFile.fileName.startsWith(sourceRoot) ||
            !sourceFile.fileName.endsWith('.tsx')
        )
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
                const line =
                    sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
                if (owner) {
                    const expected = sorted(resolvedPtKeys(owner));
                    const type = checker.getNonNullableType(
                        checker.getTypeAtLocation(node),
                    );
                    const actual = sorted(
                        checker.getPropertiesOfType(type).map((symbol) => symbol.name),
                    );
                    if (!sameValues(actual, expected)) {
                        problems.push(
                            `${relative}:${line} ${owner} pt keys differ: source=[${actual.join(', ')}], manifest=[${expected.join(', ')}].`,
                        );
                    }
                } else {
                    problems.push(
                        `${relative}:${line} declares public pt without a manifest owner.`,
                    );
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
        dynamicTestSelectors.map((entry) => [
            `${entry.file}\0${entry.expression}`,
            entry,
        ]),
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
                const line =
                    sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
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
                    const line =
                        sourceFile.getLineAndCharacterOfPosition(node.getStart()).line +
                        1;
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
            )
                inspectText(node.text, node);
            else if (ts.isTemplateExpression(node))
                inspectText(node.getText(sourceFile).slice(1, -1), node);
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
    }

    for (const [key, entry] of dynamicMap) {
        if (!seenDynamic.has(key))
            problems.push(
                `Stale dynamic test-selector mapping for ${entry.file}: '${entry.expression}'.`,
            );
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

const stateAttributeFromFixture = (source) => {
    const sourceFile = ts.createSourceFile(
        'fixture.tsx',
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
    );
    let result;
    const visit = (node) => {
        if (
            ts.isJsxAttribute(node) &&
            typeof node.name.text === 'string' &&
            node.name.text.startsWith('data-')
        )
            result = node;
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return { sourceFile, attribute: result };
};

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
        failures.push('matching part fixture did not pass');

    const unknownState = validatePartStateDefinition('Widget', ['root'], {
        root: ['unknown'],
    });
    if (
        !unknownState.some((problem) =>
            problem.includes("unknown canonical state 'unknown'"),
        )
    )
        failures.push('planted unknown state declaration was not detected');

    const orphanedState = compareComponentStates(
        'Widget',
        { root: ['selected'] },
        new Map([['root', new Set()]]),
    );
    if (
        !orphanedState.some((problem) =>
            problem.includes("orphaned canonical state 'selected'"),
        )
    )
        failures.push('planted orphaned state declaration was not detected');

    for (const source of [
        "<div data-selected='false' />",
        '<div data-selected={false} />',
        '<div data-selected={selected} />',
        "<div data-selected={'false' || undefined} />",
    ]) {
        const fixture = stateAttributeFromFixture(source);
        if (!stateValueProblem(fixture.attribute, fixture.sourceFile, 'fixture.tsx'))
            failures.push(`planted false-valued state was not detected: ${source}`);
    }
    for (const source of [
        '<div data-selected />',
        "<div data-selected='true' />",
        '<div data-selected={selected || undefined} />',
        '<div data-selected={selected ? true : undefined} />',
    ]) {
        const fixture = stateAttributeFromFixture(source);
        if (stateValueProblem(fixture.attribute, fixture.sourceFile, 'fixture.tsx'))
            failures.push(`false-safe state fixture did not pass: ${source}`);
    }
    return failures;
}

export function verifyPartsManifest() {
    const selfTestProblems = runSelfTests();
    if (selfTestProblems.length > 0)
        return selfTestProblems.map((problem) => `Self-test failed: ${problem}`);

    const {
        partEmissions,
        stateEmissions,
        problems: emissionProblems,
    } = readProductionEmissions();
    const { problems: definitionProblems, allParts } = verifyDefinitions(
        partEmissions,
        stateEmissions,
    );
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
        for (const problem of selfTestProblems)
            console.error(`verify-parts-manifest: ${problem}`);
        process.exit(1);
    }
    console.log(
        'verify-parts-manifest self-tests passed (unknown, orphaned, and false-valued state fixtures).',
    );
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
    const stateCount = Object.keys(partDefinitions).reduce(
        (count, component) =>
            count +
            Object.values(resolvedPartStates(component)).reduce(
                (componentCount, states) => componentCount + states.length,
                0,
            ),
        0,
    );
    console.log(
        `Parts manifest verified: ${componentCount} components, ${partCount} component parts, ${stateCount} component/part states, 38 pt files, and 41 pt declarations.`,
    );
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) main();
