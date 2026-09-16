// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { matchesExternalIssue, publicTypeIssueForCompiler } from '../Source/scripts/lib/public-type-exceptions.mjs';
import { normalizeTypeScriptDiagnosticPath } from './lib/typescript-diagnostic-path.mjs';

const metadata = JSON.parse(readFileSync(new URL('../Source/scripts/verify-public-types.exceptions.json', import.meta.url), 'utf8'));
const webGpuIssue = metadata.upstreamIssues.find((issue) => issue.id === 'pixi-webgpu-types-lib-conflict');

for (const [version, allowed, rejected] of [['6.0.3', 'TS6200', 'TS2300'], ['7.0.2', 'TS2300', 'TS6200']]) {
    test(`bounds the WebGPU diagnostic code mapping to TypeScript ${version}`, () => {
        const issue = publicTypeIssueForCompiler(webGpuIssue, version);
        const diagnostic = { file: 'typescript/lib/lib.dom.d.ts', message: 'Duplicate identifier', code: allowed };
        assert.equal(matchesExternalIssue(diagnostic, issue, '@cratis/components'), true);
        assert.equal(matchesExternalIssue({ ...diagnostic, code: rejected }, issue, '@cratis/components'), false);
        assert.equal(matchesExternalIssue({ ...diagnostic, file: '@cratis/components/dist/esm/Canvas/index.d.ts' }, issue, '@cratis/components'), false);
        assert.equal(matchesExternalIssue({ ...diagnostic, file: 'consumer.ts' }, issue, '@cratis/components'), false);
    });
}

for (const [platform, architecture] of [['darwin', 'arm64'], ['linux', 'x64'], ['win32', 'x64']]) {
    test(`normalizes only the active TS7 ${platform}/${architecture} compiler library location`, () => {
        const file = `@typescript/typescript-${platform}-${architecture}/lib/lib.dom.d.ts`;
        assert.equal(normalizeTypeScriptDiagnosticPath(file, '7.0.2', platform, architecture), 'typescript/lib/lib.dom.d.ts');
        assert.equal(normalizeTypeScriptDiagnosticPath(file, '6.0.3', platform, architecture), file);
    });
}

for (const file of [
    '@cratis/components/dist/esm/index.d.ts',
    '@webgpu/types/dist/index.d.ts',
    '@typescript/typescript-linux-x64/lib/lib.dom.d.ts',
    '@typescript/typescript-darwin-arm64/dist/lib.dom.d.ts',
    '@typescript/another-package/lib/lib.dom.d.ts',
    'consumer.ts',
]) {
    test(`preserves unrelated diagnostic path '${file}'`, () => {
        assert.equal(normalizeTypeScriptDiagnosticPath(file, '7.0.2', 'darwin', 'arm64'), file);
    });
}
