// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getTypeScriptCompiler } from './lib/typescript-compiler.mjs';

const repositoryDirectory = fileURLToPath(new URL('../', import.meta.url));
const verifiers = [
    'Source/scripts/verify-public-types.mjs',
    'Source/scripts/verify-no-pixi-consumer.mjs',
    'Source/scripts/verify-spatial-consumer.mjs',
    'Conformance/scripts/verify-packed-package.mjs',
    'Adapters/Mui/scripts/verify-packed-package.mjs',
    'Adapters/PrimeReact/scripts/verify-packed-package.mjs',
    'Adapters/PrimeReact10/scripts/verify-packed-package.mjs',
];

// Compile the same prepared release candidate with both supported consumer compilers.
// Each verifier packs the artifact and keeps its existing strictness and fidelity checks.
for (const major of ['6', '7']) {
    const compiler = getTypeScriptCompiler(major);
    for (const verifier of verifiers) {
        console.log(`\nTypeScript ${compiler.version} consumer check: ${verifier}`);
        const result = spawnSync(process.execPath, [verifier], {
            cwd: repositoryDirectory,
            env: { ...process.env, CRATIS_TYPESCRIPT_VERSION: major },
            stdio: 'inherit',
        });
        if (result.error) throw result.error;
        if (result.status !== 0) process.exit(result.status ?? 1);
    }
}
console.log('\nTypeScript 6 and 7 packed-consumer matrix passed.');
