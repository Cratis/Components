// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
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

export function parseTypeScriptVersions(arguments_) {
    if (arguments_.length === 0) return ['6', '7'];
    const usage = 'Usage: verify-typescript-consumers [--typescript 6|7]';
    if (arguments_.length !== 2) throw new Error(usage);
    if (arguments_[0] !== '--typescript') throw new Error(usage);
    if (!['6', '7'].includes(arguments_[1])) throw new Error(usage);
    return [arguments_[1]];
}

// Compile the same prepared release candidate with the selected consumer compilers.
// Each verifier packs the artifact and keeps its existing strictness and fidelity checks.
function verifyConsumers(versions) {
    for (const major of versions) {
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
    console.log(`\nTypeScript ${versions.join(' and ')} packed-consumer matrix passed.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    verifyConsumers(parseTypeScriptVersions(process.argv.slice(2)));
}
