const HOOK_IDENTIFIER = /^use[A-Z0-9]/;
// Matches a `.use(...)` / `.useSuspense(...)` / `.useChangeStream(...)` member call — the
// shape of a generated Arc query/command proxy hook — as well as bare `useX()` hooks.
const HOOK_MEMBER = /^use([A-Z0-9]|$)/;

const decoratorName = (decorator) => {
    const expression = decorator.expression;
    if (!expression) return undefined;
    if (expression.type === 'Identifier') return expression.name;
    if (expression.type === 'CallExpression' && expression.callee?.type === 'Identifier') {
        return expression.callee.name;
    }
    return undefined;
};

const hasInjectableDecorator = (classNode) => {
    const decorators = classNode.decorators ?? [];
    return decorators.some((decorator) => decoratorName(decorator) === 'injectable');
};

const isHookCall = (node) => {
    const callee = node.callee;
    if (!callee) return false;
    if (callee.type === 'Identifier') return HOOK_IDENTIFIER.test(callee.name);
    if (callee.type === 'MemberExpression' && callee.property?.type === 'Identifier' && !callee.computed) {
        return HOOK_MEMBER.test(callee.property.name);
    }
    return false;
};

// Walk a class body for hook calls, without descending into a nested class (a different
// subject) — but still descend through the view model's own methods and getters.
const forEachHookCall = (node, visit) => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') return;
    if (node.type === 'CallExpression' && isHookCall(node)) {
        visit(node);
    }
    for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        const child = node[key];
        if (Array.isArray(child)) {
            for (const item of child) forEachHookCall(item, visit);
        } else {
            forEachHookCall(child, visit);
        }
    }
};

// Forbid React hooks (including generated Arc proxies' `.use()`) inside a class that is a
// view model — one registered via `withViewModel`, decorated with `@injectable`, or named
// `*ViewModel`. `react-hooks/rules-of-hooks` does not reliably flag hooks called from class
// methods; a view model must be plain, hook-free TypeScript and receive injected
// abstractions instead.
export const noHooksInViewModel = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow React hooks (including Arc proxy .use()) inside a view model class.',
            recommended: true,
            url: 'https://github.com/Cratis/Components/blob/main/ESLint/README.md',
        },
        schema: [],
        messages: {
            noHook: "Do not call the hook '{{name}}' inside a view model. View models must be plain, hook-free classes — inject the abstraction (IIdentityProvider, IMessenger, a query service) instead.",
        },
    },
    create(context) {
        const registeredViewModels = new Set();
        const classNodes = [];

        const nameOfCallee = (callee) => {
            if (!callee) return undefined;
            if (callee.type === 'Identifier') return callee.name;
            if (callee.type === 'MemberExpression' && callee.property?.type === 'Identifier') {
                return callee.property.name;
            }
            return undefined;
        };

        const hookName = (node) => {
            const callee = node.callee;
            if (callee.type === 'Identifier') return callee.name;
            if (callee.type === 'MemberExpression' && callee.property?.type === 'Identifier') {
                return `.${callee.property.name}`;
            }
            return 'hook';
        };

        const collectClass = (node) => {
            classNodes.push(node);
        };

        return {
            CallExpression(node) {
                if (nameOfCallee(node.callee) !== 'withViewModel') return;
                const first = node.arguments[0];
                if (first?.type === 'Identifier') {
                    registeredViewModels.add(first.name);
                }
            },
            ClassDeclaration: collectClass,
            ClassExpression: collectClass,
            'Program:exit'() {
                for (const classNode of classNodes) {
                    const name = classNode.id?.name;
                    const isViewModel =
                        (name && /ViewModel$/.test(name)) ||
                        hasInjectableDecorator(classNode) ||
                        (name && registeredViewModels.has(name));
                    if (!isViewModel) continue;

                    forEachHookCall(classNode.body, (call) => {
                        context.report({ node: call, messageId: 'noHook', data: { name: hookName(call) } });
                    });
                }
            },
        };
    },
};

export default noHooksInViewModel;
