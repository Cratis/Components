// Collect every `return` statement that belongs directly to `functionBody`, without
// descending into nested functions (their returns are not this function's returns) or into
// a return's own argument (which may itself contain a nested arrow).
const collectOwnReturns = (node, returns) => {
    if (!node || typeof node.type !== 'string') return;
    if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
    ) {
        return;
    }
    if (node.type === 'ReturnStatement') {
        returns.push(node);
        return;
    }
    for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        const child = node[key];
        if (Array.isArray(child)) {
            for (const item of child) collectOwnReturns(item, returns);
        } else {
            collectOwnReturns(child, returns);
        }
    }
};

const keyNameOf = (key) => {
    if (!key) return undefined;
    if (key.type === 'Identifier') return key.name;
    if (key.type === 'Literal') return String(key.value);
    return undefined;
};

const transformerExports = new Map([
    [
        '@cratis/components/CommandDialog',
        new Set(['CommandDialog', 'StepperCommandDialog', 'CommandStepper']),
    ],
    ['@cratis/components/CommandStepper', new Set(['CommandStepper'])],
    ['@cratis/arc.react/commands', new Set(['CommandForm'])],
]);

const importBinding = (scope, name) => {
    for (let current = scope; current; current = current.upper) {
        const variable = current.set.get(name);
        if (variable)
            return variable.defs.find(definition => definition.type === 'ImportBinding')?.node;
    }
    return undefined;
};

// Require an `onBeforeExecute` callback to return the command values on every path. It is a
// transformer, not a side-effect hook. A runtime guard (`applyBeforeExecute`) prevents a
// missing return from executing with `undefined`: it falls back to the current object and logs
// a warning. In-place mutations may remain because the callback received that same object, but
// a replacement object is discarded and the callback still violates its contract. This lint
// backstop keeps JavaScript and loosely typed call sites from relying on that fallback. It flags
// a block-bodied callback that returns nothing, or a bare `return;`. It does not do full path
// analysis, so a callback that returns a value on some branches but can still fall through is
// not flagged.
export const onbeforeexecuteMustReturn = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Require an onBeforeExecute callback to return the command values; on a missing return the runtime falls back to the current object and warns, so replacement values are discarded.',
            recommended: true,
            url: 'https://github.com/Cratis/Components/blob/main/ESLint/README.md',
        },
        schema: [],
        messages: {
            missingReturn:
                'onBeforeExecute is a transformer and must return the command values. This callback can complete without returning, so the runtime falls back to the current object and logs a warning; any replacement value is discarded. Return the values (mutated or not).',
            emptyReturn:
                'onBeforeExecute must return the command values, not `return;`. The runtime falls back to the current object and logs a warning; any replacement value is discarded. Return the values (mutated or not).',
        },
    },
    create(context) {
        const imports = new Map();
        const isTransformer = (node) => {
            const attribute = node.parent?.parent;
            if (
                node.parent?.type !== 'JSXExpressionContainer' ||
                attribute?.type !== 'JSXAttribute' ||
                attribute.name?.name !== 'onBeforeExecute'
            ) return false;
            const opening = attribute.parent;
            if (opening?.type !== 'JSXOpeningElement') return false;
            const tag = opening.name;
            const identifier = tag.type === 'JSXIdentifier'
                ? tag
                : tag.type === 'JSXMemberExpression' &&
                    tag.object.type === 'JSXIdentifier' &&
                    tag.property.type === 'JSXIdentifier'
                    ? tag.object
                    : undefined;
            if (!identifier) return false;
            const specifier = importBinding(context.sourceCode.getScope(node), identifier.name);
            const imported = imports.get(specifier);
            if (!imported) return false;
            return tag.type === 'JSXIdentifier'
                ? imported.kind === 'named'
                : imported.kind === 'namespace' && imported.exports.has(tag.property.name);
        };
        const check = (node) => {
            if (!isTransformer(node)) return;
            // An expression-bodied arrow (`values => values`) always returns a value.
            if (
                node.type === 'ArrowFunctionExpression' &&
                node.body.type !== 'BlockStatement'
            )
                return;

            const returns = [];
            collectOwnReturns(node.body, returns);

            const emptyReturn = returns.find((statement) => !statement.argument);
            if (emptyReturn) {
                context.report({ node: emptyReturn, messageId: 'emptyReturn' });
                return;
            }

            if (returns.length === 0) {
                context.report({ node, messageId: 'missingReturn' });
            }
        };

        return {
            ImportDeclaration(node) {
                const exports = transformerExports.get(node.source.value);
                if (!exports || node.importKind === 'type') return;
                for (const specifier of node.specifiers) {
                    if (specifier.type === 'ImportNamespaceSpecifier') {
                        imports.set(specifier, { kind: 'namespace', exports });
                    } else if (
                        specifier.type === 'ImportSpecifier' &&
                        specifier.importKind !== 'type' &&
                        exports.has(keyNameOf(specifier.imported))
                    ) {
                        imports.set(specifier, { kind: 'named' });
                    }
                }
            },
            ArrowFunctionExpression: check,
            FunctionExpression: check,
        };
    },
};

export default onbeforeexecuteMustReturn;
