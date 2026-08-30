// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import ts from 'typescript';
import { packageName as defaultPackageName } from './namespaceMap.js';

const TODO = 'TODO(cratis-codemod)';
const LEGACY_VARIANT_PROPS = ['link', 'text', 'outlined'];
const RELEVANT_PROPS = new Set([
    ...LEGACY_VARIANT_PROPS,
    'rounded',
    'severity',
    'variant',
    'tone',
    'shape',
]);
const severityToTone = {
    secondary: 'neutral',
    info: 'accent',
    help: 'accent',
    success: 'positive',
    warn: 'caution',
    danger: 'critical',
    contrast: 'neutral',
};

/**
 * Migrates deprecated Button JSX appearance props to variant/tone/shape.
 * Only Button bindings imported from the Components Common subpath are considered.
 *
 * @param {string} fileName
 * @param {string} text
 * @param {{ packageName?: string }} [options]
 */
export function transformButtonVariantTone(fileName, text, options = {}) {
    const packageName = options.packageName ?? defaultPackageName;
    const sourceFile = ts.createSourceFile(
        fileName,
        text,
        ts.ScriptTarget.Latest,
        true,
        scriptKindFor(fileName),
    );
    const namedButtons = new Set();
    const commonNamespaces = new Set();
    const diagnostics = [];
    const edits = [];

    for (const statement of sourceFile.statements) {
        if (
            !ts.isImportDeclaration(statement) ||
            !ts.isStringLiteral(statement.moduleSpecifier) ||
            statement.moduleSpecifier.text !== `${packageName}/Common` ||
            !statement.importClause ||
            statement.importClause.isTypeOnly
        )
            continue;

        const bindings = statement.importClause.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings)) {
            commonNamespaces.add(bindings.name.text);
        } else if (bindings && ts.isNamedImports(bindings)) {
            for (const element of bindings.elements) {
                if (
                    !ts.isTypeOnlyImportOrExportDeclaration(element) &&
                    (element.propertyName ?? element.name).text === 'Button'
                ) {
                    namedButtons.add(element.name.text);
                }
            }
        }
    }

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

    const visit = (node) => {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            if (isImportedButtonTag(node.tagName, namedButtons, commonNamespaces)) {
                migrateOpeningElement(node);
            }
        }
        ts.forEachChild(node, visit);
    };

    const migrateOpeningElement = (node) => {
        const attributes = new Map();
        let spread;
        let duplicate;
        for (const attribute of node.attributes.properties) {
            if (ts.isJsxSpreadAttribute(attribute)) {
                spread ??= attribute;
                continue;
            }
            const name = attribute.name.getText(sourceFile);
            if (!RELEVANT_PROPS.has(name)) continue;
            if (attributes.has(name)) duplicate ??= attribute;
            attributes.set(name, attribute);
        }

        if (spread || duplicate) {
            const problem = spread ?? duplicate;
            report(
                problem,
                spread
                    ? 'Button appearance migration refused: a JSX spread can provide or override legacy/new appearance props. Expand the spread and review it manually.'
                    : 'Button appearance migration refused: duplicate appearance props depend on JSX evaluation order. Resolve the duplicate manually.',
            );
            annotateExpression(node, problem);
            return;
        }

        const replacements = new Map();
        const removals = new Set();
        let unsupportedNode;
        const unsupportedMessages = [];

        const variantAttr = attributes.get('variant');
        const legacyVariantAttrs = LEGACY_VARIANT_PROPS.map((name) => [
            name,
            attributes.get(name),
        ]).filter(([, attribute]) => attribute);
        let selectedVariant;
        let variantResolved = true;

        if (variantAttr) {
            if (
                legacyVariantAttrs.length > 0 &&
                staticString(variantAttr) === undefined
            ) {
                variantResolved = false;
                unsupportedNode ??= variantAttr;
                unsupportedMessages.push(
                    'unknown explicit Button variant conflicts with legacy variant props',
                );
            } else {
                for (const [, attribute] of legacyVariantAttrs) removals.add(attribute);
            }
        } else if (legacyVariantAttrs.length > 0) {
            const values = { link: false, text: false, outlined: false };
            for (const [name, attribute] of legacyVariantAttrs)
                values[name] = staticBoolean(attribute);
            const firstUnknown = legacyVariantAttrs.find(
                ([name]) => values[name] === undefined,
            );
            if (values.link === true) selectedVariant = 'link';
            else if (values.link === undefined) variantResolved = false;
            else if (values.text === true) selectedVariant = 'ghost';
            else if (values.text === undefined) variantResolved = false;
            else if (values.outlined === true) selectedVariant = 'outline';
            else if (values.outlined === undefined) variantResolved = false;
            else selectedVariant = 'solid';

            if (variantResolved) {
                replacements.set(
                    legacyVariantAttrs[0][1],
                    `variant='${selectedVariant}'`,
                );
                for (const [, attribute] of legacyVariantAttrs.slice(1))
                    removals.add(attribute);
            } else {
                unsupportedNode ??= firstUnknown?.[1];
                unsupportedMessages.push('dynamic Button text/link/outlined value');
            }
        }

        const shapeAttr = attributes.get('shape');
        const roundedAttr = attributes.get('rounded');
        if (shapeAttr && roundedAttr) {
            if (staticString(shapeAttr) === undefined) {
                unsupportedNode ??= shapeAttr;
                unsupportedMessages.push(
                    'unknown explicit Button shape conflicts with rounded',
                );
            } else {
                removals.add(roundedAttr);
            }
        } else if (roundedAttr) {
            const rounded = staticBoolean(roundedAttr);
            if (rounded === undefined) {
                unsupportedNode ??= roundedAttr;
                unsupportedMessages.push('dynamic Button rounded value');
            } else if (rounded) {
                replacements.set(roundedAttr, "shape='pill'");
            } else {
                removals.add(roundedAttr);
            }
        }

        const toneAttr = attributes.get('tone');
        const severityAttr = attributes.get('severity');
        let contrastNeedsSolid = false;
        if (toneAttr && severityAttr) {
            if (staticString(toneAttr) === undefined) {
                unsupportedNode ??= toneAttr;
                unsupportedMessages.push(
                    'unknown explicit Button tone conflicts with severity',
                );
            } else {
                removals.add(severityAttr);
            }
        } else if (severityAttr) {
            const severity = staticString(severityAttr);
            if (severity === undefined || !Object.hasOwn(severityToTone, severity)) {
                unsupportedNode ??= severityAttr;
                unsupportedMessages.push('dynamic or unknown Button severity value');
            } else {
                const replacement = `tone='${severityToTone[severity]}'`;
                contrastNeedsSolid = severity === 'contrast';
                replacements.set(severityAttr, replacement);
            }
        }

        if (contrastNeedsSolid && !variantAttr && variantResolved && !selectedVariant) {
            const severityReplacement = replacements.get(severityAttr);
            replacements.set(severityAttr, `${severityReplacement} variant='solid'`);
        }

        if (unsupportedNode) {
            report(
                unsupportedNode,
                `Button appearance migration requires manual review: ${unsupportedMessages.join(' and ')}. The uncertain prop group was left unchanged.`,
            );
            annotateExpression(node, unsupportedNode);
        }

        for (const [attribute, replacement] of replacements) {
            edits.push({
                start: attribute.getStart(sourceFile),
                end: attribute.getEnd(),
                replacement,
            });
        }
        for (const attribute of removals) {
            if (!replacements.has(attribute)) {
                edits.push({
                    start: attribute.getStart(sourceFile),
                    end: attribute.getEnd(),
                    replacement: '',
                });
            }
        }
    };

    const annotateExpression = (opening, problem) => {
        if (opening.getText(sourceFile).includes(TODO)) return;
        let expression;
        if (ts.isJsxSpreadAttribute(problem)) expression = problem.expression;
        else if (
            ts.isJsxAttribute(problem) &&
            problem.initializer &&
            ts.isJsxExpression(problem.initializer)
        ) {
            expression = problem.initializer.expression;
        }
        if (!expression && ts.isJsxAttribute(problem)) {
            if (problem.initializer && ts.isStringLiteral(problem.initializer)) {
                edits.push({
                    start: problem.initializer.getStart(sourceFile),
                    end: problem.initializer.getEnd(),
                    replacement: `{/* ${TODO}: review unsupported Button appearance props. */ ${problem.initializer.getText(sourceFile)}}`,
                });
            } else if (!problem.initializer) {
                edits.push({
                    start: problem.getStart(sourceFile),
                    end: problem.getEnd(),
                    replacement: `${problem.name.getText(sourceFile)}={/* ${TODO}: review unsupported Button appearance props. */ true}`,
                });
            }
            return;
        }
        if (expression) {
            edits.push({
                start: expression.getStart(sourceFile),
                end: expression.getStart(sourceFile),
                replacement: `/* ${TODO}: review unsupported Button appearance props. */ `,
            });
        }
    };

    visit(sourceFile);
    return applyEdits(text, edits, diagnostics);
}

function isImportedButtonTag(tag, namedButtons, commonNamespaces) {
    if (ts.isIdentifier(tag)) return namedButtons.has(tag.text);
    return (
        ts.isPropertyAccessExpression(tag) &&
        ts.isIdentifier(tag.expression) &&
        commonNamespaces.has(tag.expression.text) &&
        tag.name.text === 'Button'
    );
}

function staticBoolean(attribute) {
    if (!attribute.initializer) return true;
    if (ts.isStringLiteral(attribute.initializer))
        return attribute.initializer.text.length > 0;
    if (!ts.isJsxExpression(attribute.initializer) || !attribute.initializer.expression)
        return undefined;
    const expression = unwrap(attribute.initializer.expression);
    if (expression.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (
        expression.kind === ts.SyntaxKind.FalseKeyword ||
        expression.kind === ts.SyntaxKind.NullKeyword
    )
        return false;
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression))
        return expression.text.length > 0;
    if (ts.isNumericLiteral(expression)) return Number(expression.text) !== 0;
    return undefined;
}

function staticString(attribute) {
    if (!attribute.initializer) return undefined;
    if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text;
    if (!ts.isJsxExpression(attribute.initializer) || !attribute.initializer.expression)
        return undefined;
    const expression = unwrap(attribute.initializer.expression);
    return ts.isStringLiteral(expression) ||
        ts.isNoSubstitutionTemplateLiteral(expression)
        ? expression.text
        : undefined;
}

function unwrap(node) {
    while (
        ts.isParenthesizedExpression(node) ||
        ts.isAsExpression(node) ||
        ts.isTypeAssertionExpression(node)
    ) {
        node = node.expression;
    }
    return node;
}

function applyEdits(text, edits, diagnostics) {
    if (edits.length === 0) return { text, changed: false, diagnostics };
    edits.sort((a, b) => a.start - b.start || a.end - b.end);
    const unique = [];
    for (const edit of edits) {
        const previous = unique.at(-1);
        if (previous && edit.start < previous.end) continue;
        if (
            previous &&
            edit.start === previous.start &&
            edit.end === previous.end &&
            edit.replacement === previous.replacement
        )
            continue;
        unique.push(edit);
    }
    let output = text;
    for (let index = unique.length - 1; index >= 0; index--) {
        const edit = unique[index];
        output = output.slice(0, edit.start) + edit.replacement + output.slice(edit.end);
    }
    return { text: output, changed: output !== text, diagnostics };
}

function scriptKindFor(fileName) {
    if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX;
    if (fileName.endsWith('.jsx')) return ts.ScriptKind.JSX;
    if (
        fileName.endsWith('.js') ||
        fileName.endsWith('.mjs') ||
        fileName.endsWith('.cjs')
    )
        return ts.ScriptKind.JS;
    return ts.ScriptKind.TS;
}
