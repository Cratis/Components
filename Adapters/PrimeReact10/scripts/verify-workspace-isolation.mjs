// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const primeReact10Directory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
);
const repositoryDirectory = path.resolve(primeReact10Directory, '../..');
const primeReact11Directory = path.join(repositoryDirectory, 'Adapters/PrimeReact');

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const adapter10 = readJson(path.join(primeReact10Directory, 'package.json'));
const adapter11 = readJson(path.join(primeReact11Directory, 'package.json'));
const resolvePrimeReactPackage = (workspaceDirectory) => {
    const require = createRequire(path.join(workspaceDirectory, 'package.json'));
    const entry = realpathSync(require.resolve('primereact'));
    return path.join(path.dirname(entry), 'package.json');
};
const package10Path = resolvePrimeReactPackage(primeReact10Directory);
const package11Path = resolvePrimeReactPackage(primeReact11Directory);
const package10 = readJson(package10Path);
const package11 = readJson(package11Path);

if (
    adapter10.peerDependencies?.primereact !== '>=10 <11' ||
    adapter11.peerDependencies?.primereact !== '>=11 <12'
) {
    throw new Error('Adapter peer ranges no longer prove incompatible upstream majors.');
}
if (
    package10.version !== '10.9.8' ||
    package11.version !== '11.1.0' ||
    package10Path === package11Path
) {
    throw new Error(
        'The two adapter workspaces must resolve distinct exact PrimeReact 10.9.8 and 11.1.0 installations.',
    );
}

const storybookFiles = [
    path.join(repositoryDirectory, 'Source/.storybook/main.ts'),
    path.join(repositoryDirectory, 'Source/.storybook/preview.js'),
];
const storybookSource = storybookFiles
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
if (
    storybookSource.includes('@cratis/components.primereact10') ||
    storybookSource.includes('@cratis/components.primereact')
) {
    throw new Error(
        'This tranche records renderer isolation only; it must not wire either adapter into the existing Core Storybook.',
    );
}

console.log(
    'Verified independent workspace resolution: PrimeReact10 -> ' +
        `${package10.version} at ${package10Path}; PrimeReact11 -> ${package11.version} at ${package11Path}.`,
);
console.log(
    'Storybook finding: one preview dependency graph cannot satisfy both incompatible primereact peers. A future renderer-isolation tranche requires separate renderer projects/configurations; the existing Core Storybook remains unchanged.',
);
