const DEFAULTS = { source: 'primereact/dialog' };

// Disallow importing PrimeReact's Dialog directly. Cratis Components wraps it with
// behavior (Arc command binding, overlay/focus fixes, theming) via CommandDialog and the
// Dialogs surface; reaching past those to `primereact/dialog` bypasses all of it. Covers
// `import` and re-`export … from` forms.
export const noPrimereactDialog = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow importing Dialog from primereact/dialog; use the Cratis Components dialog wrappers.',
            recommended: true,
        },
        schema: [{
            type: 'object',
            properties: {
                source: { type: 'string' },
            },
            additionalProperties: false,
        }],
        messages: {
            useWrapper: "Do not import from '{{source}}'. Use CommandDialog from '@cratis/components/CommandDialog', or Dialog from '@cratis/components/Dialogs'.",
        },
    },
    create(context) {
        const options = { ...DEFAULTS, ...(context.options[0] ?? {}) };

        const check = node => {
            const source = node.source;
            if (!source || typeof source.value !== 'string') return;
            if (source.value === options.source) {
                context.report({ node: source, messageId: 'useWrapper', data: { source: options.source } });
            }
        };

        return {
            ImportDeclaration: check,
            ExportNamedDeclaration: check,
            ExportAllDeclaration: check,
        };
    },
};

export default noPrimereactDialog;
