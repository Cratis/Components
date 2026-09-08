// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAdapterPackages } from './lib/adapter-inventory.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const inventory = discoverAdapterPackages(repositoryRoot);
const readJson = file => JSON.parse(readFileSync(file, 'utf8'));

const resolvePrimeReactPackage = workspaceDirectory => {
    const require = createRequire(path.join(workspaceDirectory, 'package.json'));
    const entry = realpathSync(require.resolve('primereact/button'));
    let directory = path.dirname(entry);
    while (directory !== path.dirname(directory)) {
        const candidate = path.join(directory, 'package.json');
        try {
            if (readJson(candidate).name === 'primereact') return realpathSync(candidate);
        } catch (error) {
            if (error?.code !== 'ENOENT') throw error;
        }
        directory = path.dirname(directory);
    }
    throw new Error(`Could not locate primereact/package.json from '${entry}'.`);
};

const resolved = inventory.adapters
    .filter(adapter => adapter.expectedUpstreamVersion)
    .map(adapter => {
        const packageFile = resolvePrimeReactPackage(adapter.packageDirectory);
        const version = readJson(packageFile).version;
        if (version !== adapter.expectedUpstreamVersion) {
            throw new Error(`${adapter.metadata.id} declares ${adapter.expectedUpstreamVersion} for its preview but resolves ${version}.`);
        }
        return { adapter, packageFile, version };
    });
const prime10 = resolved.find(item => item.adapter.metadata.id === 'cratis-primereact10');
const prime11 = resolved.find(item => item.adapter.metadata.id === 'cratis-primereact');
if (!prime10 || !prime11) throw new Error('Both PrimeReact preview adapters must resolve before Storybook builds.');
if (prime10.version !== '10.9.9' || prime11.version !== '11.1.0' || prime10.packageFile === prime11.packageFile) {
    throw new Error('PrimeReact 10.9.9 and 11.1.0 must resolve from distinct package installations.');
}

const previewConfig = readFileSync(path.join(storybookRoot, 'preview/main.ts'), 'utf8');
if (!previewConfig.includes("envPrefix: 'CRATIS_STORYBOOK_PUBLIC_'")) {
    throw new Error('Renderer previews must block the default VITE_* environment namespace from client bundles.');
}

const prime10Setup = readFileSync(prime10.adapter.setupFile, 'utf8');
if (!prime10Setup.includes("primereact/resources/themes/lara-dark-blue/theme.css")) {
    throw new Error('PrimeReact 10 preview must import its nested v10 theme CSS.');
}
const prime11Setup = readFileSync(prime11.adapter.setupFile, 'utf8');
if (!prime11Setup.includes('<PrimeReactContext.Provider') || /import\s*\{[^}]*PrimeReactProvider/u.test(prime11Setup)) {
    throw new Error('PrimeReact 11 preview must use the bounded public-context fixture, never the real provider/license manager.');
}
for (const forbidden of ['process.env', 'import.meta.env', 'VITE_PRIMEUI_LICENSE_KEY', 'license=']) {
    if (prime11Setup.includes(forbidden)) throw new Error(`PrimeReact 11 preview setup must not receive or serialize license material (${forbidden}).`);
}
if (!prime11Setup.includes("'cratis-primereact.license-configured': true")) {
    throw new Error('PrimeReact 11 preview must pass only its non-secret boolean setup attestation.');
}

for (const item of resolved) {
    console.log(`${item.adapter.metadata.id} -> primereact ${item.version} at ${item.packageFile}`);
}
console.log('Verified executable peer-major isolation before Storybook build: each child process resolves one exact PrimeReact major.');
console.log('Verified bounded PrimeReact 11 public-context setup with boolean-only attestation and no license input path.');
