import { namespaceSubpaths, approvedRootSymbols } from './rootNamespaceMap.js';

const DEFAULTS = { packageName: '@cratis/components', allow: [] };

// Disallow importing a component namespace from the Cratis Components root barrel. The
// package exposes purpose-built subpath exports (`@cratis/components/CommandDialog`,
// `@cratis/components/DataPage`, `@cratis/components/Toolbar`, …); importing a namespace
// from the root pulls the whole optional-peer-heavy surface and hides intent. The small,
// approved setup surface (`CratisComponentsProvider` and friends) remains importable from
// the root. Covers `import` and re-`export … from` forms; only the `import` form is
// autofixed, and only when every named specifier in the statement is unambiguous.
export const noRootBarrelImport = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        docs: {
            description:
                'Disallow importing a component namespace from the @cratis/components root barrel; use a subpath export. Approved setup symbols (e.g. CratisComponentsProvider) remain allowed at the root.',
            recommended: true,
            url: 'https://github.com/Cratis/Components/blob/main/ESLint/README.md',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    packageName: { type: 'string' },
                    allow: { type: 'array', items: { type: 'string' } },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            useNamespaceSubpath:
                "Import '{{name}}' from '{{packageName}}/{{subpath}}' as a namespace instead of the package root barrel: import * as {{name}} from '{{packageName}}/{{subpath}}'.",
            useNamespaceSubpathExport:
                "Re-export '{{name}}' from '{{packageName}}/{{subpath}}' instead of the package root barrel: export * as {{name}} from '{{packageName}}/{{subpath}}'. This is not autofixed — verify downstream default-export expectations.",
            unknownSymbol:
                "'{{name}}' is not a recognized '{{packageName}}' root export (neither an approved setup symbol nor a known namespace). Import it from its specific subpath instead of the package root.",
            unknownSymbolExport:
                "'{{name}}' is not a recognized '{{packageName}}' root export (neither an approved setup symbol nor a known namespace). Re-export it from its specific subpath instead of the package root.",
            ambiguousImport:
                "This import of '{{packageName}}' cannot be safely auto-migrated off the root barrel — move each symbol to its subpath import manually. See ESLint/README.md.",
            ambiguousExport:
                "This wildcard re-export of '{{packageName}}' cannot be safely auto-migrated off the root barrel — replace it with explicit subpath re-exports.",
        },
    },
    create(context) {
        const options = { ...DEFAULTS, ...(context.options[0] ?? {}) };
        const packageName = options.packageName;
        const allow = new Set(options.allow);

        const isRootSpecifier = (source) =>
            !!source &&
            typeof source.value === 'string' &&
            source.value === packageName &&
            !allow.has(source.value);

        return {
            ImportDeclaration(node) {
                if (!isRootSpecifier(node.source)) return;
                checkImport(context, node, packageName);
            },
            ExportNamedDeclaration(node) {
                if (!isRootSpecifier(node.source)) return;
                checkNamedExport(context, node, packageName);
            },
            ExportAllDeclaration(node) {
                if (!isRootSpecifier(node.source)) return;
                context.report({
                    node: node.source,
                    messageId: 'ambiguousExport',
                    data: { packageName },
                });
            },
        };
    },
};

function checkImport(context, node, packageName) {
    // No specifiers at all: `import '@cratis/components';` — nothing to infer a subpath
    // from.
    if (node.specifiers.length === 0) {
        context.report({
            node: node.source,
            messageId: 'ambiguousImport',
            data: { packageName },
        });
        return;
    }

    // `import Default from '...'` and/or `import * as Namespace from '...'`.
    const hasDefault = node.specifiers.some((s) => s.type === 'ImportDefaultSpecifier');
    const hasNamespace = node.specifiers.some(
        (s) => s.type === 'ImportNamespaceSpecifier',
    );
    if (hasDefault || hasNamespace) {
        context.report({
            node: node.source,
            messageId: 'ambiguousImport',
            data: { packageName },
        });
        return;
    }

    const named = node.specifiers.filter((s) => s.type === 'ImportSpecifier');
    const kept = [];
    const namespaced = [];
    let hasUnknown = false;

    for (const specifier of named) {
        const importedName = specifier.imported.name ?? specifier.imported.value;

        if (approvedRootSymbols.has(importedName)) {
            kept.push(specifier);
            continue;
        }
        if (Object.hasOwn(namespaceSubpaths, importedName)) {
            namespaced.push({ specifier, subpath: namespaceSubpaths[importedName] });
            continue;
        }

        hasUnknown = true;
        context.report({
            node: specifier,
            messageId: 'unknownSymbol',
            data: { name: importedName, packageName },
        });
    }

    if (namespaced.length === 0) return; // nothing to move (all approved, or all unknown-and-already-reported).

    // Never guess: an unrecognized specifier means no autofix for the whole statement,
    // even for the specifiers this rule does recognize.
    const fix = hasUnknown
        ? undefined
        : (fixer) => [
              fixer.replaceText(
                  node,
                  buildReplacementText({
                      packageName,
                      declTypeOnly: node.importKind === 'type',
                      kept,
                      namespaced,
                  }),
              ),
          ];

    for (const { specifier, subpath } of namespaced) {
        const importedName = specifier.imported.name ?? specifier.imported.value;
        context.report({
            node: specifier,
            messageId: 'useNamespaceSubpath',
            data: { name: importedName, packageName, subpath },
            fix,
        });
    }
}

function checkNamedExport(context, node, packageName) {
    if (!node.specifiers || node.specifiers.length === 0) {
        // `export {} from '@cratis/components';` — nothing to report.
        return;
    }

    for (const specifier of node.specifiers) {
        const localNode = specifier.local ?? specifier;
        const exportedName = localNode.name ?? localNode.value;

        if (approvedRootSymbols.has(exportedName)) continue;
        if (Object.hasOwn(namespaceSubpaths, exportedName)) {
            context.report({
                node: specifier,
                messageId: 'useNamespaceSubpathExport',
                data: {
                    name: exportedName,
                    packageName,
                    subpath: namespaceSubpaths[exportedName],
                },
            });
            continue;
        }

        context.report({
            node: specifier,
            messageId: 'unknownSymbolExport',
            data: { name: exportedName, packageName },
        });
    }
}

function specifierText(specifier, prefix = '') {
    const importedName = specifier.imported.name ?? specifier.imported.value;
    const localName = specifier.local.name;
    const typeOnly = specifier.importKind === 'type';
    const alias = localName === importedName ? '' : ` as ${localName}`;
    return `${prefix}${typeOnly ? 'type ' : ''}${importedName}${alias}`;
}

function buildReplacementText({ packageName, declTypeOnly, kept, namespaced }) {
    const lines = [];

    if (kept.length > 0) {
        const specifiers = kept.map((specifier) => specifierText(specifier)).join(', ');
        lines.push(
            `import ${declTypeOnly ? 'type ' : ''}{ ${specifiers} } from '${packageName}';`,
        );
    }

    for (const { specifier, subpath } of namespaced) {
        const localName = specifier.local.name;
        const typeOnly = declTypeOnly || specifier.importKind === 'type';
        lines.push(
            `import ${typeOnly ? 'type ' : ''}* as ${localName} from '${packageName}/${subpath}';`,
        );
    }

    return lines.join('\n');
}

export default noRootBarrelImport;
