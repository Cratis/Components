const DEFAULTS = { packageName: '@cratis/components', allow: [] };

// Disallow importing from the Cratis Components root barrel. The package exposes
// purpose-built subpath exports (`@cratis/components/CommandDialog`,
// `@cratis/components/DataPage`, `@cratis/components/Toolbar`, …); importing the root
// pulls the whole optional-peer-heavy surface and hides intent. Covers `import` and
// re-`export … from` forms.
export const noRootBarrelImport = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow importing from the @cratis/components root barrel; use a subpath export.',
            recommended: true,
        },
        schema: [{
            type: 'object',
            properties: {
                packageName: { type: 'string' },
                allow: { type: 'array', items: { type: 'string' } },
            },
            additionalProperties: false,
        }],
        messages: {
            useSubpath: "Import from a '{{packageName}}' subpath (e.g. '{{packageName}}/CommandDialog'), not the package root barrel.",
        },
    },
    create(context) {
        const options = { ...DEFAULTS, ...(context.options[0] ?? {}) };
        const allow = new Set(options.allow);

        const check = node => {
            const source = node.source;
            if (!source || typeof source.value !== 'string') return;
            if (source.value === options.packageName && !allow.has(source.value)) {
                context.report({ node: source, messageId: 'useSubpath', data: { packageName: options.packageName } });
            }
        };

        return {
            ImportDeclaration: check,
            ExportNamedDeclaration: check,
            ExportAllDeclaration: check,
        };
    },
};

export default noRootBarrelImport;
