// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getTypeScriptCompiler } from './lib/typescript-compiler.mjs';

const repositoryDirectory = fileURLToPath(new URL('../', import.meta.url));
const publicTypesVerifier = 'Source/scripts/verify-public-types.mjs';
const allVerifiers = Object.freeze([
    publicTypesVerifier,
    'Source/scripts/verify-no-pixi-consumer.mjs',
    'Source/scripts/verify-spatial-consumer.mjs',
    'Conformance/scripts/verify-packed-package.mjs',
    'Adapters/Mui/scripts/verify-packed-package.mjs',
    'Adapters/PrimeReact/scripts/verify-packed-package.mjs',
    'Adapters/PrimeReact10/scripts/verify-packed-package.mjs',
]);

// Accepts at most one `--typescript 6|7` pair and at most one bare `--skip-public-types`, in any order.
export function parseConsumerArguments(arguments_) {
    const usage = 'Usage: verify-typescript-consumers [--typescript 6|7] [--skip-public-types]';
    let versions = ['6', '7'];
    let selected = false;
    let skipPublicTypes = false;
    for (let index = 0; index < arguments_.length; index++) {
        const argument = arguments_[index];
        if (argument === '--typescript' && !selected) {
            const major = arguments_[++index];
            if (!['6', '7'].includes(major)) throw new Error(usage);
            versions = [major];
            selected = true;
        } else if (argument === '--skip-public-types' && !skipPublicTypes) {
            skipPublicTypes = true;
        } else {
            throw new Error(usage);
        }
    }
    const verifiers = skipPublicTypes ? allVerifiers.filter(verifier => verifier !== publicTypesVerifier) : [...allVerifiers];
    return { versions, verifiers };
}

// Compile the same prepared release candidate with the selected consumer compilers.
// Each verifier packs the artifact and keeps its existing strictness and fidelity checks.
function verifyConsumers(versions, verifiers) {
    if (verifiers.length !== allVerifiers.length) {
        console.log(`Skipping ${publicTypesVerifier}: CI runs it in the verify-public-types job.`);
    }
    for (const major of versions) {
        const compiler = getTypeScriptCompiler(major);
        for (const verifier of verifiers) {
            console.log(`\nTypeScript ${compiler.version} consumer check: ${verifier}`);
            const started = performance.now();
            const result = spawnSync(process.execPath, [verifier], {
                cwd: repositoryDirectory,
                env: { ...process.env, CRATIS_TYPESCRIPT_VERSION: major },
                stdio: 'inherit',
            });
            const seconds = ((performance.now() - started) / 1000).toFixed(1);
            console.log(`TypeScript ${compiler.version} consumer check took ${seconds}s: ${verifier}`);
            if (result.error) throw result.error;
            if (result.status !== 0) process.exit(result.status ?? 1);
        }
    }
    console.log(`\nTypeScript ${versions.join(' and ')} packed-consumer matrix passed (${verifiers.length} verifier(s) per compiler).`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    const { versions, verifiers } = parseConsumerArguments(process.argv.slice(2));
    verifyConsumers(versions, verifiers);
}
