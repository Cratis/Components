// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {} from 'chai/register-should';

// The CommandForm subpath must still link against @cratis/arc.react 20.3.1, the oldest supported
// peer. A named runtime import that 20.3.1 does not export fails when the module loads, so every value
// that published CommandForm code imports from @cratis/arc.react must be in this list: the complete
// runtime export list of @cratis/arc.react@20.3.1's `commands` entry, read from the published package.
const runtimeExportsOfArcReact20_3_1 = [
    'CheckboxField', 'CommandForm', 'CommandFormContext', 'CommandFormField', 'CommandFormFieldWrapper',
    'CommandFormFields', 'CommandScope', 'CommandScopeContext', 'CommandScopeImplementation', 'ICommandScope',
    'InputTextField', 'NumberField', 'RangeField', 'SelectField', 'TextAreaField', 'ValidationMessage',
    'asCommandFormField', 'useCommand', 'useCommandFormContext', 'useCommandInstance', 'useCommandScope',
    'useSetCommandResult',
];

const commandFormFolder = join(dirname(fileURLToPath(import.meta.url)), '..');
const isPublishedSource = (path: string) =>
    /\.tsx?$/.test(path) && !/\.stories\.tsx?$/.test(path) && !/(^|\/)(for_|when_|given)/.test(relative(commandFormFolder, path));
const sourceFiles = (folder: string): string[] => readdirSync(folder).flatMap((entry) => {
    const path = join(folder, entry);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
}).filter(isPublishedSource);

const runtimeImportsFromArcReact = (source: string) => [...source.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+'@cratis\/arc\.react(?:\/[^']*)?'/g)]
    .filter((match) => !match[1])
    .flatMap((match) => match[2].split(','))
    .map((name) => name.trim())
    .filter((name) => name.length > 0 && !name.startsWith('type '))
    .map((name) => name.split(/\s+as\s+/)[0]);

describe('when CommandForm is imported on the oldest supported Arc React', () => {
    let files: string[];
    let imported: Map<string, string[]>;

    beforeEach(() => {
        files = sourceFiles(commandFormFolder);
        imported = new Map(files.map((file) => [relative(commandFormFolder, file), runtimeImportsFromArcReact(readFileSync(file, 'utf8'))]));
    });

    it('should inspect the GuidField source', () => [...imported.keys()].should.include(join('fields', 'GuidField.tsx')));
    it('should import GuidField binding only through asCommandFormField and useCommandFormContext', () =>
        imported.get(join('fields', 'GuidField.tsx'))!.should.have.members(['asCommandFormField', 'useCommandFormContext']));
    it('should import no runtime symbol missing from Arc React 20.3.1', () =>
        [...imported.entries()].flatMap(([file, names]) => names.filter((name) => !runtimeExportsOfArcReact20_3_1.includes(name)).map((name) => `${file}: ${name}`))
            .should.deep.equal([]));
    it('should import only from the commands entry of Arc React', () =>
        files.filter((file) => /from\s+'@cratis\/arc\.react(?!\/commands')/.test(readFileSync(file, 'utf8'))).should.deep.equal([]));
    it('should not import a namespace or default from Arc React', () =>
        files.filter((file) => /import\s+(\*\s+as\s+\w+|\w+)\s+from\s+'@cratis\/arc\.react/.test(readFileSync(file, 'utf8'))).should.deep.equal([]));
});
