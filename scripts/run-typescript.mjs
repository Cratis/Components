// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { getTypeScriptCompiler } from './lib/typescript-compiler.mjs';

const compiler = getTypeScriptCompiler();
const result = spawnSync(process.execPath, [compiler.path, ...process.argv.slice(2)], {
    stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
