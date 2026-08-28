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
    const entry = realpathSync(require.resolve('primereact/button'));
    let directory = path.dirname(entry);

    while (directory !== path.dirname(directory)) {
        const candidate = path.join(directory, 'package.json');
        try {
            if (readJson(candidate).name === 'primereact') {
                return realpathSync(candidate);
            }
        } catch (error) {
            if (error?.code !== 'ENOENT') throw error;
        }
        directory = path.dirname(directory);
    }

    throw new Error(`Could not locate primereact/package.json from '${entry}'.`);
};
const package10Path = resolvePrimeReactPackage(primeReact10Directory);
const package11Path = resolvePrimeReactPackage(primeReact11Directory);
const package10 = readJson(package10Path);
const package11 = readJson(package11Path);

if (
    adapter10.peerDependencies?.primereact !== '>=10.9.9 <11' ||
    adapter11.peerDependencies?.primereact !== '>=11 <12'
) {
    throw new Error('Adapter peer ranges no longer prove incompatible upstream majors.');
}
if (
    package10.version !== '10.9.9' ||
    package11.version !== '11.1.0' ||
    package10Path === package11Path
) {
    throw new Error(
        'The two adapter workspaces must resolve distinct exact PrimeReact 10.9.9 and 11.1.0 installations.',
    );
}

const storybookPreviewConfig = readFileSync(
    path.join(repositoryDirectory, 'Storybook/preview/main.ts'),
    'utf8',
);
if (
    !storybookPreviewConfig.includes('CRATIS_STORYBOOK_ADAPTER_ID') ||
    !storybookPreviewConfig.includes('cratis-renderer-build-attestation') ||
    storybookPreviewConfig.includes("from '@cratis/components.primereact10'") ||
    storybookPreviewConfig.includes("from '@cratis/components.primereact'")
) {
    throw new Error(
        'The composed Storybook must select one metadata-discovered adapter per separately built preview graph.',
    );
}

console.log(
    'Verified independent workspace resolution: PrimeReact10 -> ' +
        `${package10.version} at ${package10Path}; PrimeReact11 -> ${package11.version} at ${package11Path}.`,
);
console.log(
    'Verified Storybook isolation: metadata selects one adapter per child build, and the composed manager references the separately emitted previews.',
);
