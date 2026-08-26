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

// True when `node` is the function assigned to an `onBeforeExecute` binding — a JSX
// attribute (`onBeforeExecute={...}`), an object property (`{ onBeforeExecute: ... }`), or a
// variable (`const onBeforeExecute = ...`).
const isOnBeforeExecuteCallback = (node) => {
    const parent = node.parent;
    if (!parent) return false;

    if (
        parent.type === 'JSXExpressionContainer' &&
        parent.parent?.type === 'JSXAttribute' &&
        parent.parent.name?.name === 'onBeforeExecute'
    ) {
        return true;
    }

    if (
        (parent.type === 'Property' || parent.type === 'PropertyDefinition') &&
        parent.value === node &&
        keyNameOf(parent.key) === 'onBeforeExecute'
    ) {
        return true;
    }

    if (
        parent.type === 'VariableDeclarator' &&
        parent.init === node &&
        parent.id?.type === 'Identifier' &&
        parent.id.name === 'onBeforeExecute'
    ) {
        return true;
    }

    return false;
};

// Require an `onBeforeExecute` callback to return the command values on every path. It is a
// transformer, not a side-effect hook: a body that can complete without returning silently
// skips the transform — a runtime guard (`applyBeforeExecute`) keeps the current values and
// logs a `console.warn` instead of executing the command with `undefined`, but the callback's
// intended changes never applied and that warning is easy to miss outside a fully-typed call
// site. A lint backstop for consumers whose call sites are not fully typed — it flags a
// block-bodied callback that returns nothing, or a bare `return;`. It does not do full path
// analysis, so a callback that returns a value on some branches but can still fall through is
// not flagged.
export const onbeforeexecuteMustReturn = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Require an onBeforeExecute callback to return the command values; a callback that returns nothing silently skips the transform (the runtime keeps the previous values and warns instead of applying it).',
            recommended: true,
            url: 'https://github.com/Cratis/Components/blob/main/ESLint/README.md',
        },
        schema: [],
        messages: {
            missingReturn:
                'onBeforeExecute is a transformer and must return the command values. This callback can complete without returning, which silently skips the transform: the runtime keeps the current values and logs a warning instead of applying your changes. Return the values (mutated or not).',
            emptyReturn:
                'onBeforeExecute must return the command values, not `return;`. A bare return silently skips the transform: the runtime keeps the current values and logs a warning instead of applying your changes. Return the values (mutated or not).',
        },
    },
    create(context) {
        const check = (node) => {
            if (!isOnBeforeExecuteCallback(node)) return;
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
            ArrowFunctionExpression: check,
            FunctionExpression: check,
        };
    },
};

export default onbeforeexecuteMustReturn;
