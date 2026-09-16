// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const getTypeScriptCompiler = (major = process.env.CRATIS_TYPESCRIPT_VERSION ?? '7') => {
    if (major !== '6' && major !== '7') {
        throw new Error(`Unsupported CRATIS_TYPESCRIPT_VERSION '${major}'; expected 6 or 7.`);
    }
    const directory = major === '7' ? '@typescript/native' : 'typescript';
    const packageDirectory = new URL(`../../node_modules/${directory}/`, import.meta.url);
    const manifest = JSON.parse(readFileSync(new URL('package.json', packageDirectory), 'utf8'));
    if (!manifest.version.startsWith(`${major}.`)) {
        throw new Error(`Expected TypeScript ${major}, found ${manifest.version} in '${directory}'.`);
    }
    return {
        version: manifest.version,
        path: fileURLToPath(new URL('bin/tsc', packageDirectory)),
    };
};
