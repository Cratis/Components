// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    browserDomGlobals,
    isKernelReactSpecifier,
    isKernelSourcePath,
    kernelSourcePaths,
} from './kernelBoundary.js';

/**
 * Keeps the repository's explicitly declared computation kernel independent of React and browser DOM APIs.
 * The filename check is intentional: this is an owned architectural boundary, not a consumer-wide ban.
 */
export const noReactInKernel = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow React package edges and browser DOM globals in explicitly declared Components kernel modules.',
            recommended: false,
            url: 'https://github.com/Cratis/Components/blob/main/Documentation/decisions/0003-kernel-boundary.md',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    kernelPaths: {
                        type: 'array',
                        items: { type: 'string' },
                        uniqueItems: true,
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            forbiddenDependency:
                "Kernel module '{{file}}' must not depend on '{{specifier}}'. Keep React, React DOM, and React Aria Components outside the repository-owned kernel.",
            forbiddenBrowserGlobal:
                "Kernel module '{{file}}' must not use browser DOM global '{{name}}'. Pass data through a React/DOM adapter outside the kernel instead.",
        },
    },
    create(context) {
        const kernelPaths = context.options[0]?.kernelPaths ?? kernelSourcePaths;
        const filename = context.filename;
        if (!isKernelSourcePath(filename, kernelPaths, context.cwd ?? process.cwd())) {
            return {};
        }

        const file = kernelPaths.find((candidate) =>
            isKernelSourcePath(filename, [candidate], context.cwd ?? process.cwd()),
        );
        const reportedGlobals = new Set();

        const reportSpecifier = (node) => {
            if (!node || typeof node.value !== 'string') return;
            if (!isKernelReactSpecifier(node.value)) return;
            context.report({
                node,
                messageId: 'forbiddenDependency',
                data: { file, specifier: node.value },
            });
        };

        return {
            ImportDeclaration(node) {
                reportSpecifier(node.source);
            },
            ExportNamedDeclaration(node) {
                reportSpecifier(node.source);
            },
            ExportAllDeclaration(node) {
                reportSpecifier(node.source);
            },
            TSImportEqualsDeclaration(node) {
                const reference = node.moduleReference;
                if (reference?.type === 'TSExternalModuleReference') {
                    reportSpecifier(reference.expression);
                }
            },
            ImportExpression(node) {
                reportSpecifier(node.source);
            },
            CallExpression(node) {
                if (node.callee.type !== 'Identifier' || node.callee.name !== 'require') {
                    return;
                }
                const [argument] = node.arguments;
                if (!argument || argument.type === 'SpreadElement') return;
                reportSpecifier(argument);
            },
            'Program:exit'() {
                const forbidden = new Set(browserDomGlobals);
                const scopes = context.sourceCode.scopeManager?.scopes ?? [];
                for (const scope of scopes) {
                    for (const reference of scope.references) {
                        const identifier = reference.identifier;
                        if (!forbidden.has(identifier.name)) continue;
                        if (reference.resolved?.defs?.length > 0) continue;
                        const key = `${identifier.range?.[0] ?? identifier.loc.start.line}:${identifier.name}`;
                        if (reportedGlobals.has(key)) continue;
                        reportedGlobals.add(key);
                        context.report({
                            node: identifier,
                            messageId: 'forbiddenBrowserGlobal',
                            data: { file, name: identifier.name },
                        });
                    }
                }
            },
        };
    },
};

export default noReactInKernel;
