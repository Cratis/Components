import { RuleTester } from 'eslint';
import { afterAll, describe, expect, it } from 'vitest';
import tsParser from '@typescript-eslint/parser';
import componentsPlugin from '../index.js';
import { noPrimereactDialog } from '../lib/noPrimereactDialog.js';
import { noRootBarrelImport } from '../lib/noRootBarrelImport.js';
import {
    approvedRootSymbols as eslintApprovedRootSymbols,
    namespaceSubpaths as eslintNamespaceSubpaths,
    removedRootSymbols as eslintRemovedRootSymbols,
} from '../lib/rootNamespaceMap.js';
import {
    approvedRootSymbols as codemodApprovedRootSymbols,
    namespaceSubpaths as codemodNamespaceSubpaths,
    removedRootSymbols as codemodRemovedRootSymbols,
} from '../../Migrator/lib/namespaceMap.js';
import { onbeforeexecuteMustReturn } from '../lib/onbeforeexecuteMustReturn.js';
import { noHooksInViewModel } from '../lib/noHooksInViewModel.js';
import { noRawCommandFormMarker } from '../lib/noRawCommandFormMarker.js';
import { noReactInKernel } from '../lib/noReactInKernel.js';
import { isKernelReactSpecifier, kernelSourcePaths } from '../lib/kernelBoundary.js';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
});

// A tester using the TypeScript parser for JSX and decorator syntax.
const tsRuleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        parserOptions: { ecmaFeatures: { jsx: true } },
    },
});

describe('recommended consumer coverage', () => {
    it('applies the migration guards to every source extension the codemod scans', () => {
        expect(componentsPlugin.configs.recommended[0].files).toEqual([
            '**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}',
        ]);
    });
});

describe('root namespace map parity', () => {
    it('keeps the ESLint and codemod namespace maps identical', () => {
        expect(eslintNamespaceSubpaths).toEqual(codemodNamespaceSubpaths);
    });

    it('keeps the ESLint and codemod setup allowlists identical', () => {
        expect([...eslintApprovedRootSymbols].sort()).toEqual(
            [...codemodApprovedRootSymbols].sort(),
        );
    });

    it('keeps the ESLint and codemod removed-root sets identical', () => {
        expect([...eslintRemovedRootSymbols].sort()).toEqual(
            [...codemodRemovedRootSymbols].sort(),
        );
    });
});

tsRuleTester.run('no-root-barrel-import', noRootBarrelImport, {
    valid: [
        // Subpath imports are always fine, whatever the export.
        "import { CommandDialog } from '@cratis/components/CommandDialog';",
        "import { DataPage } from '@cratis/components/DataPage';",
        "import { useState } from 'react';",
        "import Canvas = require('@cratis/components/Canvas');",
        'import Canvas = Components.Canvas;',
        "const canvas = await import('@cratis/components/Canvas');",
        "const canvas = require('@cratis/components/Canvas');",
        // Not the same package — a longer name that merely starts the same.
        "import x from '@cratis/components-extra';",
        // Approved setup symbols remain importable from the root, singly, combined, aliased,
        // and as types.
        "import { CratisComponentsProvider } from '@cratis/components';",
        "import { CratisComponentsProvider, cratisDefaults, mergeCratisComponentsConfig } from '@cratis/components';",
        "import { CratisComponentsProvider as Provider } from '@cratis/components';",
        "import type { CratisComponentsConfig, CratisComponentsProviderProps } from '@cratis/components';",
        "import { type CratisComponentsConfig } from '@cratis/components';",
        "import { useCratisComponentsConfig } from '@cratis/components';",
        "import type { CratisComponentsMessages, CratisPaginatorMessages, CratisDatePickerMessages, CratisDropdownMessages, CratisDialogMessages, CratisStepperMessages, CratisNotificationsMessages, CratisDataTableMessages, CratisColumnFilterMessages } from '@cratis/components';",
        // Re-exporting an approved setup symbol from the root is fine too.
        "export { CratisComponentsProvider } from '@cratis/components';",
        // The 'allow' option still permits an exact specifier wholesale.
        {
            code: "import { Canvas } from '@cratis/components';",
            options: [{ allow: ['@cratis/components'] }],
        },
    ],
    invalid: [
        {
            // A single namespace is autofixed to its subpath, as a namespace import.
            code: "import { Canvas } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpath',
                    data: {
                        name: 'Canvas',
                        packageName: '@cratis/components',
                        subpath: 'Canvas',
                    },
                },
            ],
            output: "import * as Canvas from '@cratis/components/Canvas';",
        },
        {
            // 'import type' is preserved on the generated namespace import.
            code: "import type { Canvas } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpath',
                    data: {
                        name: 'Canvas',
                        packageName: '@cratis/components',
                        subpath: 'Canvas',
                    },
                },
            ],
            output: "import type * as Canvas from '@cratis/components/Canvas';",
        },
        {
            // A per-specifier 'type' modifier is honored the same way.
            code: "import { type Canvas } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpath',
                    data: {
                        name: 'Canvas',
                        packageName: '@cratis/components',
                        subpath: 'Canvas',
                    },
                },
            ],
            output: "import type * as Canvas from '@cratis/components/Canvas';",
        },
        {
            // Aliases are preserved on the generated namespace import.
            code: "import { Canvas as C } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpath',
                    data: {
                        name: 'Canvas',
                        packageName: '@cratis/components',
                        subpath: 'Canvas',
                    },
                },
            ],
            output: "import * as C from '@cratis/components/Canvas';",
        },
        {
            // The former root CommandStepper namespace was the complete CommandDialog module,
            // not the narrower dedicated CommandStepper subpath. Preserve module identity.
            code: "import { CommandStepper as StepperNS } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpath',
                    data: {
                        name: 'CommandStepper',
                        packageName: '@cratis/components',
                        subpath: 'CommandDialog',
                    },
                },
            ],
            output: "import * as StepperNS from '@cratis/components/CommandDialog';",
        },
        {
            // 'Types' is the one namespace whose subpath differs in casing from its name.
            code: "import { Types } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpath',
                    data: {
                        name: 'Types',
                        packageName: '@cratis/components',
                        subpath: 'types',
                    },
                },
            ],
            output: "import * as Types from '@cratis/components/types';",
        },
        {
            // Several namespaces in one import become one subpath import each, in order.
            code: "import { Canvas, Common } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpath',
                    data: {
                        name: 'Canvas',
                        packageName: '@cratis/components',
                        subpath: 'Canvas',
                    },
                },
                {
                    messageId: 'useNamespaceSubpath',
                    data: {
                        name: 'Common',
                        packageName: '@cratis/components',
                        subpath: 'Common',
                    },
                },
            ],
            output: "import * as Canvas from '@cratis/components/Canvas';\nimport * as Common from '@cratis/components/Common';",
        },
        {
            // A mixed import is split: the approved symbol stays at the root, the namespace moves.
            code: "import { CratisComponentsProvider, Canvas } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpath',
                    data: {
                        name: 'Canvas',
                        packageName: '@cratis/components',
                        subpath: 'Canvas',
                    },
                },
            ],
            output: "import { CratisComponentsProvider } from '@cratis/components';\nimport * as Canvas from '@cratis/components/Canvas';",
        },
        {
            // An unrelated existing subpath import on the line above is left completely alone.
            code: "import { Dialog } from '@cratis/components/Dialogs';\nimport { Canvas } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpath',
                    data: {
                        name: 'Canvas',
                        packageName: '@cratis/components',
                        subpath: 'Canvas',
                    },
                },
            ],
            output: "import { Dialog } from '@cratis/components/Dialogs';\nimport * as Canvas from '@cratis/components/Canvas';",
        },
        {
            // A symbol that is neither an approved setup symbol nor a known namespace (it only
            // exists *inside* the Common namespace) is flagged but never guessed at — no autofix.
            code: "import { Button } from '@cratis/components';",
            errors: [
                {
                    messageId: 'unknownSymbol',
                    data: { name: 'Button', packageName: '@cratis/components' },
                },
            ],
            output: null,
        },
        {
            // An unknown specifier alongside an approved one: still flagged, still no fix, and the
            // approved symbol never gets a spurious report.
            code: "import { CratisComponentsProvider, Button } from '@cratis/components';",
            errors: [
                {
                    messageId: 'unknownSymbol',
                    data: { name: 'Button', packageName: '@cratis/components' },
                },
            ],
            output: null,
        },
        {
            // An unknown specifier alongside a namespace: the namespace is still reported (rich
            // guidance), but neither gets autofixed — never guess at the whole statement.
            code: "import { Canvas, Button } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpath',
                    data: {
                        name: 'Canvas',
                        packageName: '@cratis/components',
                        subpath: 'Canvas',
                    },
                },
                {
                    messageId: 'unknownSymbol',
                    data: { name: 'Button', packageName: '@cratis/components' },
                },
            ],
            output: null,
        },
        {
            // Components 3 exposed this renderer namespace, but Components 4 has no replacement subpath.
            code: "import { Compatibility as PrimeCompatibility } from '@cratis/components';",
            errors: [
                {
                    messageId: 'removedCompatibilitySymbol',
                    data: { name: 'Compatibility' },
                },
            ],
            output: null,
        },
        {
            code: "import type { PrimeReact11PassThroughComponent } from '@cratis/components';",
            errors: [
                {
                    messageId: 'removedCompatibilitySymbol',
                    data: { name: 'PrimeReact11PassThroughComponent' },
                },
            ],
            output: null,
        },
        {
            code: "import { Chat, Compatibility } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpath',
                    data: {
                        name: 'Chat',
                        packageName: '@cratis/components',
                        subpath: 'Chat',
                    },
                },
                {
                    messageId: 'removedCompatibilitySymbol',
                    data: { name: 'Compatibility' },
                },
            ],
            output: null,
        },
        {
            // A namespace import of the whole package cannot be safely rewritten.
            code: "import * as Components from '@cratis/components';",
            errors: [
                {
                    messageId: 'ambiguousImport',
                    data: { packageName: '@cratis/components' },
                },
            ],
            output: null,
        },
        {
            // A default import — the package has no default export — is equally ambiguous.
            code: "import Components from '@cratis/components';",
            errors: [{ messageId: 'ambiguousImport' }],
            output: null,
        },
        {
            // A side-effect-only import has no binding to infer a subpath from.
            code: "import '@cratis/components';",
            errors: [{ messageId: 'ambiguousImport' }],
            output: null,
        },
        {
            // TypeScript import assignments bind the whole package namespace and cannot be split.
            code: "import Components = require('@cratis/components');",
            errors: [{ messageId: 'ambiguousImport' }],
            output: null,
        },
        {
            // Dynamic imports cannot be mapped without analyzing later member access.
            code: "const Components = await import('@cratis/components');",
            errors: [{ messageId: 'ambiguousImport' }],
            output: null,
        },
        {
            // CommonJS require calls have the same ambiguity.
            code: "const Components = require('@cratis/components');",
            errors: [{ messageId: 'ambiguousImport' }],
            output: null,
        },
        {
            // Re-exporting a namespace gets subpath guidance but is never autofixed.
            code: "export { Canvas } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpathExport',
                    data: {
                        name: 'Canvas',
                        packageName: '@cratis/components',
                        subpath: 'Canvas',
                    },
                },
            ],
            output: null,
        },
        {
            // The export alias is preserved in the guidance name; the check is on the source-side name.
            code: "export { Canvas as CanvasNS } from '@cratis/components';",
            errors: [
                {
                    messageId: 'useNamespaceSubpathExport',
                    data: {
                        name: 'Canvas',
                        packageName: '@cratis/components',
                        subpath: 'Canvas',
                    },
                },
            ],
            output: null,
        },
        {
            code: "export { Button } from '@cratis/components';",
            errors: [
                {
                    messageId: 'unknownSymbolExport',
                    data: { name: 'Button', packageName: '@cratis/components' },
                },
            ],
            output: null,
        },
        {
            code: "export { primeReact11PassThroughSentinelPreset } from '@cratis/components';",
            errors: [
                {
                    messageId: 'removedCompatibilitySymbolExport',
                    data: { name: 'primeReact11PassThroughSentinelPreset' },
                },
            ],
            output: null,
        },
        {
            code: "export * from '@cratis/components';",
            errors: [
                {
                    messageId: 'ambiguousExport',
                    data: { packageName: '@cratis/components' },
                },
            ],
            output: null,
        },
        {
            code: "export * as Everything from '@cratis/components';",
            errors: [{ messageId: 'ambiguousExport' }],
            output: null,
        },
        {
            // Configurable package name — the Cratis namespace map still applies to it.
            code: "import { Canvas } from '@acme/ui';",
            options: [{ packageName: '@acme/ui' }],
            errors: [
                {
                    messageId: 'useNamespaceSubpath',
                    data: { name: 'Canvas', packageName: '@acme/ui', subpath: 'Canvas' },
                },
            ],
            output: "import * as Canvas from '@acme/ui/Canvas';",
        },
    ],
});

ruleTester.run('no-primereact-dialog', noPrimereactDialog, {
    valid: [
        "import { CommandDialog } from '@cratis/components/CommandDialog';",
        "import { Dialog } from '@cratis/components/Dialogs';",
        "import { Button } from 'primereact/button';",
    ],
    invalid: [
        {
            code: "import { Dialog } from 'primereact/dialog';",
            errors: [{ messageId: 'useWrapper', data: { source: 'primereact/dialog' } }],
        },
        {
            code: "import Dialog from 'primereact/dialog';",
            errors: [{ messageId: 'useWrapper' }],
        },
        {
            code: "export { Dialog } from 'primereact/dialog';",
            errors: [{ messageId: 'useWrapper' }],
        },
    ],
});

tsRuleTester.run('onbeforeexecute-must-return', onbeforeexecuteMustReturn, {
    valid: [
        // Expression-bodied arrow always returns.
        'const a = <CommandDialog onBeforeExecute={values => values} />;',
        // Block body that returns the values.
        "const b = <CommandDialog onBeforeExecute={(values) => { values.id = '1'; return values; }} />;",
        // Object property form.
        'const c = { onBeforeExecute: (v) => v };',
        // Variable form.
        'const onBeforeExecute = (v) => { return v; };',
        // A nested callback returning nothing does not count against the outer return.
        'const d = <CommandDialog onBeforeExecute={(v) => { [1].forEach(() => {}); return v; }} />;',
        // Unrelated callbacks are never flagged, even when they return nothing.
        'const e = <button onClick={() => { doThing(); }} />;',
    ],
    invalid: [
        {
            code: 'const a = <CommandDialog onBeforeExecute={(values) => { doSideEffect(values); }} />;',
            errors: [{ messageId: 'missingReturn' }],
        },
        {
            code: 'const b = <CommandDialog onBeforeExecute={function (values) { doSideEffect(values); }} />;',
            errors: [{ messageId: 'missingReturn' }],
        },
        {
            code: 'const c = <CommandDialog onBeforeExecute={(values) => { return; }} />;',
            errors: [{ messageId: 'emptyReturn' }],
        },
        {
            code: 'const d = { onBeforeExecute: (v) => { log(v); } };',
            errors: [{ messageId: 'missingReturn' }],
        },
    ],
});

describe('onbeforeexecute-must-return message wording', () => {
    // The runtime guard (applyBeforeExecute) falls back to the current object and warns instead
    // of executing with `undefined`; in-place mutations may remain, while replacement values are
    // discarded. Keep the rule aligned with that behavior rather than the pre-guard data-loss claim.
    const { missingReturn, emptyReturn } = onbeforeexecuteMustReturn.meta.messages;

    it('does not claim the command executes with undefined values', () => {
        expect(missingReturn).not.toMatch(/executes.*undefined/i);
        expect(emptyReturn).not.toMatch(/executes.*undefined/i);
    });

    it('does not claim values are wiped', () => {
        expect(missingReturn).not.toMatch(/wipe/i);
        expect(emptyReturn).not.toMatch(/wipe/i);
    });

    it('describes the guarded fallback and discarded replacement value', () => {
        expect(missingReturn).toMatch(/falls back to the current object/);
        expect(missingReturn).toMatch(/logs a warning/);
        expect(missingReturn).toMatch(/replacement value is discarded/);
        expect(emptyReturn).toMatch(/falls back to the current object/);
        expect(emptyReturn).toMatch(/logs a warning/);
        expect(emptyReturn).toMatch(/replacement value is discarded/);
    });
});

tsRuleTester.run('no-hooks-in-view-model', noHooksInViewModel, {
    valid: [
        // A view model with no hooks.
        'class FooViewModel { select(id) { this.selected = id; } }',
        // A *ViewModel calling a plain method is fine.
        'class BarViewModel { compute() { return this.transform(); } }',
        // A non-view-model class may use hooks (it is a component/helper, not a VM).
        'class Helper { render() { const x = useState(0); return x; } }',
        // An injectable view model with only injected collaborators.
        '@injectable class BazViewModel { constructor(private readonly svc) {} load() { return this.svc.get(); } }',
    ],
    invalid: [
        {
            // Generated Arc proxy .use() inside a *ViewModel.
            code: 'class FooViewModel { load() { const [x] = AllAuthors.use(); return x; } }',
            errors: [{ messageId: 'noHook', data: { name: '.use' } }],
        },
        {
            // A React hook inside an @injectable view model.
            code: '@injectable class Bar { method() { const s = useState(0); return s; } }',
            errors: [{ messageId: 'noHook', data: { name: 'useState' } }],
        },
        {
            // A class registered via withViewModel, even without the naming/decorator signals.
            code: 'class Vm { method() { useIdentity(); } } const C = withViewModel(Vm, () => null);',
            errors: [{ messageId: 'noHook', data: { name: 'useIdentity' } }],
        },
    ],
});

describe('kernel boundary inventory', () => {
    it('exposes one canonical list to the repository config', () => {
        expect(kernelSourcePaths).toContain('Source/PivotViewer/engine/store.ts');
        expect(kernelSourcePaths).toContain('Source/SchemaEditor/schemaHelpers.ts');
    });

    it.each([
        'react',
        'react/jsx-runtime',
        'react-dom',
        'react-dom/client',
        'react-aria-components',
        'react-aria-components/Button',
    ])('classifies React kernel dependency %s', (specifier) => {
        expect(isKernelReactSpecifier(specifier)).toBe(true);
    });

    it.each([
        'reactive',
        'react-dom-extra',
        'react-aria',
        'react-aria-components-extra',
        '@react/components',
    ])('allows near-miss kernel dependency %s', (specifier) => {
        expect(isKernelReactSpecifier(specifier)).toBe(false);
    });
});

tsRuleTester.run('no-react-in-kernel', noReactInKernel, {
    valid: [
        {
            filename: 'Source/PivotViewer/engine/store.ts',
            code: "import { compute } from 'reactive'; compute();",
        },
        {
            filename: 'Source/PivotViewer/engine/store.ts',
            code: "const renderer = await import('react-dom-extra'); void renderer;",
        },
        {
            filename: 'Source/PivotViewer/engine/store.ts',
            code: "const document = { title: 'local' }; document.title;",
        },
        {
            filename: 'Source/Canvas/Canvas.tsx',
            code: "import React from 'react'; document.createElement('div'); void React;",
        },
        {
            filename: 'Source/PivotViewer/engine/store.ts',
            code: "import type { Event } from './events'; const event = {} as Event; void event;",
        },
    ],
    invalid: [
        {
            filename: 'Source/PivotViewer/engine/store.ts',
            code: "import React from 'react'; void React;",
            errors: [
                {
                    messageId: 'forbiddenDependency',
                    data: {
                        file: 'Source/PivotViewer/engine/store.ts',
                        specifier: 'react',
                    },
                },
            ],
        },
        {
            filename: 'Source/PivotViewer/engine/store.ts',
            code: "import { createRoot } from 'react-dom/client'; void createRoot;",
            errors: [{ messageId: 'forbiddenDependency' }],
        },
        {
            filename: 'Source/PivotViewer/engine/store.ts',
            code: "const aria = await import('react-aria-components/Button'); void aria;",
            errors: [{ messageId: 'forbiddenDependency' }],
        },
        {
            filename: 'Source/PivotViewer/engine/store.ts',
            code: "const server = require('react-dom/server'); void server;",
            errors: [{ messageId: 'forbiddenDependency' }],
        },
        {
            filename: 'Source/PivotViewer/engine/store.ts',
            code: "export { useState } from 'react';",
            errors: [{ messageId: 'forbiddenDependency' }],
        },
        {
            filename: 'Source/PivotViewer/engine/store.ts',
            code: "document.createElement('div');",
            languageOptions: { globals: { document: 'readonly' } },
            errors: [
                {
                    messageId: 'forbiddenBrowserGlobal',
                    data: {
                        file: 'Source/PivotViewer/engine/store.ts',
                        name: 'document',
                    },
                },
            ],
        },
        {
            filename: 'Source/PivotViewer/engine/store.ts',
            code: 'const element = {} as HTMLElement; void element;',
            errors: [{ messageId: 'forbiddenBrowserGlobal' }],
        },
    ],
});

tsRuleTester.run('no-raw-command-form-marker', noRawCommandFormMarker, {
    valid: [
        // The sanctioned way to mark and to test, in both directions.
        'markAsCommandFormField(MyField);',
        'markAsCommandFormColumn(MyColumn);',
        'if (isCommandFormField(component)) { wrap(component); }',
        'if (isCommandFormColumn(component)) { layout(component); }',
        // Referring to the exported constant rather than repeating the literal.
        'MyField.displayName = CommandFormFieldDisplayName;',
        'if (component.displayName === CommandFormFieldDisplayName) { wrap(component); }',
        // Declaring the constants themselves — the one place the literal belongs.
        "export const CommandFormFieldDisplayName = 'CommandFormField';",
        "export const CommandFormColumnDisplayName = 'CommandFormColumn';",
        // displayName used as the diagnostic label it is meant to be.
        "MyDialog.displayName = 'MyDialog';",
        "StepperPanel.displayName = 'StepperPanel';",
        'const label = `DialogWrapper(${Component.displayName})`;',
        // A different property that happens to hold the same string.
        "const meta = { kind: 'CommandFormField' };",
        // Comparing a non-displayName property.
        "if (component.name === 'CommandFormField') { legacy(component); }",
    ],
    invalid: [
        {
            code: "MyField.displayName = 'CommandFormField';",
            errors: [
                {
                    messageId: 'useMarkHelper',
                    data: { helper: 'markAsCommandFormField', name: 'CommandFormField' },
                },
            ],
        },
        {
            code: "MyColumn.displayName = 'CommandFormColumn';",
            errors: [
                {
                    messageId: 'useMarkHelper',
                    data: {
                        helper: 'markAsCommandFormColumn',
                        name: 'CommandFormColumn',
                    },
                },
            ],
        },
        {
            // Computed member access is the same stamp.
            code: "MyField['displayName'] = 'CommandFormField';",
            errors: [
                {
                    messageId: 'useMarkHelper',
                    data: { helper: 'markAsCommandFormField', name: 'CommandFormField' },
                },
            ],
        },
        {
            // Set through an object literal, e.g. Object.assign.
            code: "Object.assign(MyField, { displayName: 'CommandFormField' });",
            errors: [
                {
                    messageId: 'useMarkHelper',
                    data: { helper: 'markAsCommandFormField', name: 'CommandFormField' },
                },
            ],
        },
        {
            code: "if (component.displayName === 'CommandFormField') { wrap(component); }",
            errors: [
                {
                    messageId: 'usePredicate',
                    data: { helper: 'isCommandFormField', name: 'CommandFormField' },
                },
            ],
        },
        {
            // Reversed operand order.
            code: "if ('CommandFormColumn' === component.displayName) { layout(component); }",
            errors: [
                {
                    messageId: 'usePredicate',
                    data: { helper: 'isCommandFormColumn', name: 'CommandFormColumn' },
                },
            ],
        },
        {
            // Negated comparison misses a renamed field just as badly.
            code: "if (component.displayName !== 'CommandFormField') { return child; }",
            errors: [
                {
                    messageId: 'usePredicate',
                    data: { helper: 'isCommandFormField', name: 'CommandFormField' },
                },
            ],
        },
        {
            // The cast form this package used before the marker existed.
            code: "if ((component as { displayName?: string }).displayName === 'CommandFormField') { wrap(component); }",
            errors: [
                {
                    messageId: 'usePredicate',
                    data: { helper: 'isCommandFormField', name: 'CommandFormField' },
                },
            ],
        },
    ],
});
