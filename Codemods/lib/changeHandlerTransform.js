// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import ts from 'typescript';
import { packageName as defaultPackageName } from './namespaceMap.js';

const TODO = 'TODO(cratis-codemod)';
const affectedComponents = {
    CommandForm: {
        InputTextField: new Set(['target.value', 'currentTarget.value']),
        PasswordField: new Set(['target.value', 'currentTarget.value']),
        TextAreaField: new Set(['target.value', 'currentTarget.value']),
        ColorPickerField: new Set(['target.value', 'currentTarget.value']),
        CheckboxField: new Set(['target.checked', 'currentTarget.checked']),
        ToggleSwitchField: new Set(['target.checked', 'currentTarget.checked']),
        NumberField: new Set(['target.valueAsNumber', 'currentTarget.valueAsNumber']),
        SliderField: new Set(['target.valueAsNumber', 'currentTarget.valueAsNumber']),
        DropdownField: new Set(['value']),
        MultiSelectField: new Set(['value']),
    },
    Dropdown: {
        Dropdown: new Set(['value']),
    },
};

/**
 * Rewrites structurally-proven legacy event-wrapper JSX callbacks to semantic values.
 *
 * @param {string} fileName
 * @param {string} text
 * @param {{ packageName?: string }} [options]
 */
export function transformChangeHandlers(fileName, text, options = {}) {
    const packageName = options.packageName ?? defaultPackageName;
    const sourceFile = ts.createSourceFile(
        fileName,
        text,
        ts.ScriptTarget.Latest,
        true,
        scriptKindFor(fileName),
    );
    const named = new Map();
    const namespaces = new Map();
    const diagnostics = [];
    const edits = [];

    for (const statement of sourceFile.statements) {
        if (
            !ts.isImportDeclaration(statement) ||
            !ts.isStringLiteral(statement.moduleSpecifier) ||
            !statement.importClause ||
            statement.importClause.isTypeOnly
        )
            continue;
        const group = groupForSpecifier(statement.moduleSpecifier.text, packageName);
        if (!group) continue;
        const bindings = statement.importClause.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings)) {
            namespaces.set(bindings.name.text, group);
        } else if (bindings && ts.isNamedImports(bindings)) {
            for (const element of bindings.elements) {
                const imported = (element.propertyName ?? element.name).text;
                if (
                    !ts.isTypeOnlyImportOrExportDeclaration(element) &&
                    affectedComponents[group][imported]
                ) {
                    named.set(element.name.text, { group, component: imported });
                }
            }
        }
    }

    const report = (node, component, reason) => {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile),
        );
        diagnostics.push({
            file: fileName,
            line: line + 1,
            column: character + 1,
            message: `${component} change-handler migration requires manual review: ${reason}. The callback was left unchanged.`,
        });
    };

    const visit = (node) => {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            const target = resolveTarget(node.tagName, named, namespaces);
            if (target) migrateCallbacks(node, target);
        }
        ts.forEachChild(node, visit);
    };

    const migrateCallbacks = (opening, target) => {
        const allowed = affectedComponents[target.group][target.component];
        for (const attribute of opening.attributes.properties) {
            if (!ts.isJsxAttribute(attribute)) continue;
            const propName = attribute.name.getText(sourceFile);
            if (propName !== 'onChange' && propName !== 'onValueChange') continue;
            if (
                !attribute.initializer ||
                !ts.isJsxExpression(attribute.initializer) ||
                !attribute.initializer.expression
            )
                continue;

            const callback = unwrap(attribute.initializer.expression);
            if (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback))
                continue;
            const result = analyzeCallback(callback, allowed);
            if (result.kind === 'already-semantic' || result.kind === 'irrelevant')
                continue;
            if (result.kind === 'unsupported') {
                report(attribute, target.component, result.reason);
                annotate(attribute);
                continue;
            }

            edits.push({
                start: result.parameter.getStart(sourceFile),
                end: result.parameter.getEnd(),
                replacement: result.name,
            });
            edits.push({
                start: result.argument.getStart(sourceFile),
                end: result.argument.getEnd(),
                replacement: result.name,
            });
        }
    };

    const annotate = (attribute) => {
        if (attribute.getText(sourceFile).includes(TODO)) return;
        const expression = attribute.initializer?.expression;
        if (!expression) return;
        edits.push({
            start: expression.getStart(sourceFile),
            end: expression.getStart(sourceFile),
            replacement: `/* ${TODO}: review ambiguous Components change handler. */ `,
        });
    };

    visit(sourceFile);
    return applyEdits(text, edits, diagnostics);
}

function groupForSpecifier(specifier, packageName) {
    if (
        specifier === `${packageName}/CommandForm` ||
        specifier === `${packageName}/CommandForm/fields`
    )
        return 'CommandForm';
    if (specifier === `${packageName}/Dropdown`) return 'Dropdown';
    return undefined;
}

function resolveTarget(tag, named, namespaces) {
    if (ts.isIdentifier(tag)) return named.get(tag.text);
    if (!ts.isPropertyAccessExpression(tag) || !ts.isIdentifier(tag.expression))
        return undefined;
    const group = namespaces.get(tag.expression.text);
    if (!group || !affectedComponents[group][tag.name.text]) return undefined;
    return { group, component: tag.name.text };
}

function analyzeCallback(callback, allowed) {
    if (callback.parameters.length !== 1) {
        return hasLegacyLookingAccess(callback, callback.parameters[0])
            ? {
                  kind: 'unsupported',
                  reason: 'the callback has multiple parameters or an unsupported parameter shape',
              }
            : { kind: 'irrelevant' };
    }

    const parameter = callback.parameters[0];
    if (parameter.dotDotDotToken || parameter.initializer) {
        return {
            kind: 'unsupported',
            reason: 'rest/default callback parameters are not statically safe',
        };
    }

    const binding = bindingAccess(parameter.name);
    if (!binding) {
        return {
            kind: 'unsupported',
            reason: 'the destructured callback parameter is not a single event value field',
        };
    }

    const call = singleCall(callback.body);
    if (!call || call.arguments.length !== 1) {
        return callbackUsesBinding(callback, binding)
            ? {
                  kind: 'unsupported',
                  reason: 'the callback is not a single one-argument forwarding call',
              }
            : { kind: 'irrelevant' };
    }

    const argument = unwrap(call.arguments[0]);
    const access = accessFromArgument(argument, binding);
    const references = bindingReferences(callback, binding);

    if (access && allowed.has(access) && references === 1) {
        const name = containsIdentifier(call.expression, 'value') ? 'nextValue' : 'value';
        return { kind: 'rewrite', parameter, argument: call.arguments[0], name };
    }

    if (access || references > 0 || hasLegacyLookingAccess(callback, parameter)) {
        if (
            binding.kind === 'identifier' &&
            references === 1 &&
            ts.isIdentifier(argument) &&
            argument.text === binding.localName
        ) {
            return /^(e|event|evt|changeEvent)$/iu.test(binding.localName)
                ? {
                      kind: 'unsupported',
                      reason: 'the callback forwards an event-looking parameter without proving its semantic value',
                  }
                : { kind: 'already-semantic' };
        }
        return {
            kind: 'unsupported',
            reason:
                access && !allowed.has(access)
                    ? `it reads '${access}', which is not the legacy payload shape for this component`
                    : 'the event parameter is used more than once or the callback depends on native-event details',
        };
    }

    return { kind: 'irrelevant' };
}

function bindingAccess(name) {
    if (ts.isIdentifier(name)) return { kind: 'identifier', localName: name.text };
    if (!ts.isObjectBindingPattern(name) || name.elements.length !== 1) return undefined;
    const element = name.elements[0];
    if (element.dotDotDotToken || element.initializer) return undefined;
    const first = (element.propertyName ?? element.name).getText();
    if (
        ts.isIdentifier(element.name) &&
        (first === 'value' || first === 'checked' || first === 'valueAsNumber')
    ) {
        return { kind: 'destructured', access: first, localName: element.name.text };
    }
    if (
        (first === 'target' || first === 'currentTarget') &&
        ts.isObjectBindingPattern(element.name) &&
        element.name.elements.length === 1
    ) {
        const nested = element.name.elements[0];
        if (nested.dotDotDotToken || nested.initializer || !ts.isIdentifier(nested.name))
            return undefined;
        const property = (nested.propertyName ?? nested.name).getText();
        if (
            property === 'value' ||
            property === 'checked' ||
            property === 'valueAsNumber'
        ) {
            return {
                kind: 'destructured',
                access: `${first}.${property}`,
                localName: nested.name.text,
            };
        }
    }
    return undefined;
}

function singleCall(body) {
    if (!ts.isBlock(body)) {
        const expression = unwrap(body);
        return ts.isCallExpression(expression) ? expression : undefined;
    }
    if (body.statements.length !== 1) return undefined;
    const statement = body.statements[0];
    if (ts.isExpressionStatement(statement)) {
        const expression = unwrap(statement.expression);
        return ts.isCallExpression(expression) ? expression : undefined;
    }
    if (ts.isReturnStatement(statement) && statement.expression) {
        const expression = unwrap(statement.expression);
        return ts.isCallExpression(expression) ? expression : undefined;
    }
    return undefined;
}

function accessFromArgument(argument, binding) {
    if (binding.kind === 'destructured') {
        return ts.isIdentifier(argument) && argument.text === binding.localName
            ? binding.access
            : undefined;
    }
    const parts = [];
    let current = argument;
    while (ts.isPropertyAccessExpression(current)) {
        parts.unshift(current.name.text);
        current = unwrap(current.expression);
    }
    return ts.isIdentifier(current) && current.text === binding.localName
        ? parts.join('.')
        : undefined;
}

function bindingReferences(callback, binding) {
    let count = 0;
    const visit = (node) => {
        if (node === callback.parameters[0]) return;
        if (ts.isIdentifier(node) && node.text === binding.localName) count += 1;
        ts.forEachChild(node, visit);
    };
    ts.forEachChild(callback.body, visit);
    return count;
}

function callbackUsesBinding(callback, binding) {
    return bindingReferences(callback, binding) > 0;
}

function hasLegacyLookingAccess(callback, parameter) {
    if (!parameter || !ts.isIdentifier(parameter.name)) return false;
    const root = parameter.name.text;
    let found = false;
    const visit = (node) => {
        if (ts.isPropertyAccessExpression(node)) {
            let current = node;
            while (ts.isPropertyAccessExpression(current))
                current = unwrap(current.expression);
            if (ts.isIdentifier(current) && current.text === root) found = true;
        }
        if (!found) ts.forEachChild(node, visit);
    };
    ts.forEachChild(callback.body, visit);
    return found;
}

function containsIdentifier(node, name) {
    let found = false;
    const visit = (child) => {
        if (ts.isIdentifier(child) && child.text === name) found = true;
        if (!found) ts.forEachChild(child, visit);
    };
    visit(node);
    return found;
}

function unwrap(node) {
    while (
        ts.isParenthesizedExpression(node) ||
        ts.isAsExpression(node) ||
        ts.isTypeAssertionExpression(node)
    )
        node = node.expression;
    return node;
}

function applyEdits(text, edits, diagnostics) {
    if (edits.length === 0) return { text, changed: false, diagnostics };
    edits.sort((a, b) => a.start - b.start || a.end - b.end);
    let output = text;
    for (let index = edits.length - 1; index >= 0; index--) {
        const edit = edits[index];
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
