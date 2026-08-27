// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { transformButtonVariantTone } from '../lib/buttonVariantToneTransform.js';
import { transformChangeHandlers } from '../lib/changeHandlerTransform.js';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixture = (family, name, file) =>
    readFileSync(path.join(testDir, family, name, file), 'utf8');

const expectValidTsx = (fileName, source) => {
    const sourceFile = ts.createSourceFile(
        fileName,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
    );
    expect(sourceFile.parseDiagnostics).toEqual([]);
};

const buttonCases = [
    ['aliases-and-precedence', 0],
    ['dynamic-refusal', 2],
    ['non-components-untouched', 0],
];

const handlerCases = [
    ['aliases-and-safe-wrappers', 0],
    ['ambiguous-refusal', 2],
    ['already-semantic', 0],
];

describe('Button variant/tone transform', () => {
    for (const [name, diagnosticCount] of buttonCases) {
        it(`matches the ${name} fixture and is idempotent`, () => {
            const input = fixture('button-fixtures', name, 'input.tsx');
            const expected = fixture('button-fixtures', name, 'expected.tsx');
            const first = transformButtonVariantTone(`${name}/input.tsx`, input);
            expect(first.text).toBe(expected);
            expect(first.diagnostics).toHaveLength(diagnosticCount);
            expectValidTsx(`${name}/expected.tsx`, first.text);

            const second = transformButtonVariantTone(`${name}/expected.tsx`, first.text);
            expect(second.text).toBe(expected);
            expect(second.changed).toBe(false);
            expect(second.diagnostics).toHaveLength(diagnosticCount);
            expect((second.text.match(/TODO\(cratis-codemod\)/gu) ?? []).length).toBe(
                (first.text.match(/TODO\(cratis-codemod\)/gu) ?? []).length,
            );
        });
    }

    it('maps every literal severity and preserves explicit new-prop precedence', () => {
        const input = [
            "import { Button } from '@cratis/components/Common';",
            "const a=<Button severity='secondary'/>;",
            "const b=<Button severity='info'/>;",
            "const c=<Button severity='help'/>;",
            "const d=<Button severity='success'/>;",
            "const e=<Button severity='warn'/>;",
            "const f=<Button severity='danger'/>;",
            "const g=<Button severity='contrast' text/>;",
            'const h=<Button variant={variant} link={dynamic} tone={tone} severity={severity} shape={shape} rounded={dynamic}/>;',
            '',
        ].join('\n');
        const result = transformButtonVariantTone('Buttons.tsx', input);

        expect(result.diagnostics).toHaveLength(1);
        expect(result.text).toContain("tone='neutral'");
        expect(result.text).toContain("tone='accent'");
        expect(result.text).toContain("tone='positive'");
        expect(result.text).toContain("tone='caution'");
        expect(result.text).toContain("tone='critical'");
        expect(result.text).toContain("variant='ghost'");
        expect(result.text).toContain(
            'variant={/* TODO(cratis-codemod): review unsupported Button appearance props. */ variant} link={dynamic} tone={tone} severity={severity} shape={shape} rounded={dynamic}',
        );
    });

    it('supports a package override without touching the default package', () => {
        const input =
            "import { Button as B } from '@example/ui/Common';\nimport { Button } from '@cratis/components/Common';\nconst x=<><B text/><Button text/></>;\n";
        const result = transformButtonVariantTone('Buttons.tsx', input, {
            packageName: '@example/ui',
        });
        expect(result.text).toContain("<B variant='ghost'/>");
        expect(result.text).toContain('<Button text/>');
    });
});

describe('change-handler transform', () => {
    for (const [name, diagnosticCount] of handlerCases) {
        it(`matches the ${name} fixture and is idempotent`, () => {
            const input = fixture('change-handler-fixtures', name, 'input.tsx');
            const expected = fixture('change-handler-fixtures', name, 'expected.tsx');
            const first = transformChangeHandlers(`${name}/input.tsx`, input);
            expect(first.text).toBe(expected);
            expect(first.diagnostics).toHaveLength(diagnosticCount);
            expectValidTsx(`${name}/expected.tsx`, first.text);

            const second = transformChangeHandlers(`${name}/expected.tsx`, first.text);
            expect(second.text).toBe(expected);
            expect(second.changed).toBe(false);
            expect(second.diagnostics).toHaveLength(diagnosticCount);
            expect((second.text.match(/TODO\(cratis-codemod\)/gu) ?? []).length).toBe(
                (first.text.match(/TODO\(cratis-codemod\)/gu) ?? []).length,
            );
        });
    }

    it('rewrites every affected CommandForm payload shape and onValueChange', () => {
        const input = [
            "import * as F from '@cratis/components/CommandForm';",
            'const fields=<>',
            '<F.PasswordField onChange={(e)=>save(e.currentTarget.value)}/>',
            '<F.TextAreaField onChange={(e)=>save(e.target.value)}/>',
            '<F.ColorPickerField onChange={(e)=>save(e.target.value)}/>',
            '<F.CheckboxField onChange={(e)=>save(e.currentTarget.checked)}/>',
            '<F.ToggleSwitchField onValueChange={(e)=>save(e.target.checked)}/>',
            '<F.SliderField onChange={(e)=>save(e.target.valueAsNumber)}/>',
            '<F.DropdownField onChange={(e)=>save(e.value)}/>',
            '<F.MultiSelectField onChange={(e)=>save(e.value)}/>',
            '</>;',
            '',
        ].join('\n');
        const result = transformChangeHandlers('Fields.tsx', input);
        expect(result.diagnostics).toEqual([]);
        expect(result.text.match(/\(value\)=>save\(value\)/gu)).toHaveLength(8);
    });

    it('refuses wrong payloads and multi-use native-event dependencies', () => {
        const input =
            "import { CheckboxField } from '@cratis/components/CommandForm';\nconst x=<CheckboxField onChange={(event)=>consume(event.target.value)}/>;\n";
        const result = transformChangeHandlers('Fields.tsx', input);
        expect(result.diagnostics).toHaveLength(1);
        expect(result.text).toContain('TODO(cratis-codemod)');
        expect(result.text).toContain('event.target.value');
    });

    it('supports a package override', () => {
        const input =
            "import { Dropdown as D } from '@example/ui/Dropdown';\nconst x=<D onChange={(e)=>consume(e.value)}/>;\n";
        const result = transformChangeHandlers('Fields.tsx', input, {
            packageName: '@example/ui',
        });
        expect(result.text).toContain('(value)=>consume(value)');
        expect(result.diagnostics).toEqual([]);
    });
});
