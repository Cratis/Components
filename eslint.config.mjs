import eslint from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import header from '@tony.ganchev/eslint-plugin-header';
import noNull from 'eslint-plugin-no-null';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import componentsPlugin from './ESLint/index.js';
import { kernelSourcePaths } from './ESLint/lib/kernelBoundary.js';

const getRules = configArray => {
    let rules = {};

    const addRulesFromObject = config => {
        if (Object.hasOwn(config, 'rules')) {
            rules = {
                ...rules,
                ...config.rules,
            };
        }
    };

    if (Array.isArray(configArray)) {
        for (const config of configArray) {
            addRulesFromObject(config);
        }
    } else {
        addRulesFromObject(configArray);
    }

    return rules;
};

const reactConfig = eslintReact.configs['recommended-typescript'];

const rules = {
    ...getRules(eslint.configs.recommended),
    ...getRules(tseslint.configs.recommended),
    ...getRules(reactConfig),
    ...{
        'no-irregular-whitespace': 0,
        semi: [2, 'always'],
        'no-prototype-builtins': 0,

        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                ignoreRestSiblings: true,
                argsIgnorePattern: '^_',
            },
        ],

        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 0,
        '@typescript-eslint/no-non-null-assertion': 0,
        '@typescript-eslint/no-empty-function': 'error',
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/ban-ts-comment': 0,
        "@typescript-eslint/no-empty-interface": 0,

        '@tony.ganchev/header': [
            'error',
            {
                header: {
                    commentType: 'line',
                    lines: [
                        ' Copyright (c) Cratis. All rights reserved.',
                        ' Licensed under the MIT license. See LICENSE file in the project root for full license information.'
                    ]
                },
                trailingEmptyLines: {
                    minimum: 1
                }
            }
        ],
    },
};

const defaultConfig = [
    {
        ignores: [
            '**/*.d.ts',
            '**/*.scss.d.ts',
            '**/tsconfig.*',
            '**/wallaby.js',
            '**/*.js',
            '**/dist/**',
            '**/node_modules/**',
            '**/wwwroot/**',
            '**/templates/**',
            '**/Api/**',
            '**/rollup.config.mjs'
        ],
    },
    {
        files: ['**/*.ts', '**/*.tsx'],

        plugins: {
            '@typescript-eslint': typescriptEslint,
            ...reactConfig.plugins,
            '@tony.ganchev': header,
            'no-null': noNull
        },

        rules: rules,

        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parser: tsParser,
            sourceType: 'module',
        },

        settings: reactConfig.settings,
    },
    {
        // Storybook render callbacks are React render functions, but their required lowercase
        // `render` property name cannot satisfy component-name inference in hook/compiler rules.
        files: ['**/*.stories.tsx'],
        rules: {
            '@eslint-react/rules-of-hooks': 'off',
            '@eslint-react/no-nested-component-definitions': 'off',
            '@eslint-react/static-components': 'off',
        },
    },
    {
        // The public `unstable_` prefix intentionally precedes the component/hook name. Runtime
        // aliases use normal React names, and renderer specs verify hook order across rerenders.
        files: [
            'Source/renderer/RendererContext.tsx',
            'Source/renderer/RendererScope.tsx',
        ],
        rules: {
            '@eslint-react/rules-of-hooks': 'off',
        },
    },
    {
        // Selection synchronization deliberately flushes before focus/layout reads; its specs cover
        // the ordering guarantee and replacing it with deferred rendering changes behavior.
        files: ['Source/PivotViewer/hooks/useSelectedItem.ts'],
        rules: {
            '@eslint-react/dom-no-flush-sync': 'off',
        },
    },
    {
        files: kernelSourcePaths,
        plugins: {
            '@cratis/components': componentsPlugin,
        },
        rules: {
            '@cratis/components/no-react-in-kernel': [
                'error',
                { kernelPaths: kernelSourcePaths },
            ],
        },
    },
    {
        files: ['**/for_*/**/*.ts'],
        rules: {
            '@typescript-eslint/naming-convention': 0,
            '@typescript-eslint/no-unused-expressions': 0,
            "@typescript-eslint/no-empty-function": "off",
            'no-restricted-globals': 0,
        },
    },
];

const config = tseslint.config(...defaultConfig);
export default config;
