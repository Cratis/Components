import { RuleTester } from 'eslint';
import { afterAll, describe, it } from 'vitest';
import tsParser from '@typescript-eslint/parser';
import { noPrimereactDialog } from '../lib/noPrimereactDialog.js';
import { noRootBarrelImport } from '../lib/noRootBarrelImport.js';
import { onbeforeexecuteMustReturn } from '../lib/onbeforeexecuteMustReturn.js';
import { noHooksInViewModel } from '../lib/noHooksInViewModel.js';
import { noRawCommandFormMarker } from '../lib/noRawCommandFormMarker.js';

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

ruleTester.run('no-root-barrel-import', noRootBarrelImport, {
    valid: [
        "import { CommandDialog } from '@cratis/components/CommandDialog';",
        "import { DataPage } from '@cratis/components/DataPage';",
        "import { useState } from 'react';",
        "export { Toolbar } from '@cratis/components/Toolbar';",
        // Not the same package — a longer name that merely starts the same.
        "import x from '@cratis/components-extra';",
    ],
    invalid: [
        {
            code: "import { Button } from '@cratis/components';",
            errors: [{ messageId: 'useSubpath', data: { packageName: '@cratis/components' } }],
        },
        {
            code: "export { Button } from '@cratis/components';",
            errors: [{ messageId: 'useSubpath' }],
        },
        {
            code: "export * from '@cratis/components';",
            errors: [{ messageId: 'useSubpath' }],
        },
        {
            // Configurable package name.
            code: "import x from '@acme/ui';",
            options: [{ packageName: '@acme/ui' }],
            errors: [{ messageId: 'useSubpath', data: { packageName: '@acme/ui' } }],
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
        "const a = <CommandDialog onBeforeExecute={values => values} />;",
        // Block body that returns the values.
        "const b = <CommandDialog onBeforeExecute={(values) => { values.id = '1'; return values; }} />;",
        // Object property form.
        "const c = { onBeforeExecute: (v) => v };",
        // Variable form.
        "const onBeforeExecute = (v) => { return v; };",
        // A nested callback returning nothing does not count against the outer return.
        "const d = <CommandDialog onBeforeExecute={(v) => { [1].forEach(() => {}); return v; }} />;",
        // Unrelated callbacks are never flagged, even when they return nothing.
        "const e = <button onClick={() => { doThing(); }} />;",
    ],
    invalid: [
        {
            code: "const a = <CommandDialog onBeforeExecute={(values) => { doSideEffect(values); }} />;",
            errors: [{ messageId: 'missingReturn' }],
        },
        {
            code: "const b = <CommandDialog onBeforeExecute={function (values) { doSideEffect(values); }} />;",
            errors: [{ messageId: 'missingReturn' }],
        },
        {
            code: "const c = <CommandDialog onBeforeExecute={(values) => { return; }} />;",
            errors: [{ messageId: 'emptyReturn' }],
        },
        {
            code: "const d = { onBeforeExecute: (v) => { log(v); } };",
            errors: [{ messageId: 'missingReturn' }],
        },
    ],
});

tsRuleTester.run('no-hooks-in-view-model', noHooksInViewModel, {
    valid: [
        // A view model with no hooks.
        "class FooViewModel { select(id) { this.selected = id; } }",
        // A *ViewModel calling a plain method is fine.
        "class BarViewModel { compute() { return this.transform(); } }",
        // A non-view-model class may use hooks (it is a component/helper, not a VM).
        "class Helper { render() { const x = useState(0); return x; } }",
        // An injectable view model with only injected collaborators.
        "@injectable class BazViewModel { constructor(private readonly svc) {} load() { return this.svc.get(); } }",
    ],
    invalid: [
        {
            // Generated Arc proxy .use() inside a *ViewModel.
            code: "class FooViewModel { load() { const [x] = AllAuthors.use(); return x; } }",
            errors: [{ messageId: 'noHook', data: { name: '.use' } }],
        },
        {
            // A React hook inside an @injectable view model.
            code: "@injectable class Bar { method() { const s = useState(0); return s; } }",
            errors: [{ messageId: 'noHook', data: { name: 'useState' } }],
        },
        {
            // A class registered via withViewModel, even without the naming/decorator signals.
            code: "class Vm { method() { useIdentity(); } } const C = withViewModel(Vm, () => null);",
            errors: [{ messageId: 'noHook', data: { name: 'useIdentity' } }],
        },
    ],
});

tsRuleTester.run('no-raw-command-form-marker', noRawCommandFormMarker, {
    valid: [
        // The sanctioned way to mark and to test, in both directions.
        "markAsCommandFormField(MyField);",
        "markAsCommandFormColumn(MyColumn);",
        "if (isCommandFormField(component)) { wrap(component); }",
        "if (isCommandFormColumn(component)) { layout(component); }",
        // Referring to the exported constant rather than repeating the literal.
        "MyField.displayName = CommandFormFieldDisplayName;",
        "if (component.displayName === CommandFormFieldDisplayName) { wrap(component); }",
        // Declaring the constants themselves — the one place the literal belongs.
        "export const CommandFormFieldDisplayName = 'CommandFormField';",
        "export const CommandFormColumnDisplayName = 'CommandFormColumn';",
        // displayName used as the diagnostic label it is meant to be.
        "MyDialog.displayName = 'MyDialog';",
        "StepperPanel.displayName = 'StepperPanel';",
        "const label = `DialogWrapper(${Component.displayName})`;",
        // A different property that happens to hold the same string.
        "const meta = { kind: 'CommandFormField' };",
        // Comparing a non-displayName property.
        "if (component.name === 'CommandFormField') { legacy(component); }",
    ],
    invalid: [
        {
            code: "MyField.displayName = 'CommandFormField';",
            errors: [{ messageId: 'useMarkHelper', data: { helper: 'markAsCommandFormField', name: 'CommandFormField' } }],
        },
        {
            code: "MyColumn.displayName = 'CommandFormColumn';",
            errors: [{ messageId: 'useMarkHelper', data: { helper: 'markAsCommandFormColumn', name: 'CommandFormColumn' } }],
        },
        {
            // Computed member access is the same stamp.
            code: "MyField['displayName'] = 'CommandFormField';",
            errors: [{ messageId: 'useMarkHelper', data: { helper: 'markAsCommandFormField', name: 'CommandFormField' } }],
        },
        {
            // Set through an object literal, e.g. Object.assign.
            code: "Object.assign(MyField, { displayName: 'CommandFormField' });",
            errors: [{ messageId: 'useMarkHelper', data: { helper: 'markAsCommandFormField', name: 'CommandFormField' } }],
        },
        {
            code: "if (component.displayName === 'CommandFormField') { wrap(component); }",
            errors: [{ messageId: 'usePredicate', data: { helper: 'isCommandFormField', name: 'CommandFormField' } }],
        },
        {
            // Reversed operand order.
            code: "if ('CommandFormColumn' === component.displayName) { layout(component); }",
            errors: [{ messageId: 'usePredicate', data: { helper: 'isCommandFormColumn', name: 'CommandFormColumn' } }],
        },
        {
            // Negated comparison misses a renamed field just as badly.
            code: "if (component.displayName !== 'CommandFormField') { return child; }",
            errors: [{ messageId: 'usePredicate', data: { helper: 'isCommandFormField', name: 'CommandFormField' } }],
        },
        {
            // The cast form this package used before the marker existed.
            code: "if ((component as { displayName?: string }).displayName === 'CommandFormField') { wrap(component); }",
            errors: [{ messageId: 'usePredicate', data: { helper: 'isCommandFormField', name: 'CommandFormField' } }],
        },
    ],
});
