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
