// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAdapterPackages } from './lib/adapter-inventory.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const storybookCli = path.join(
    repositoryRoot,
    'node_modules/storybook/dist/bin/dispatcher.js',
);
const rendererConfigDirectory = path.join(repositoryRoot, 'Source/.storybook-renderers');
const inventory = discoverAdapterPackages(repositoryRoot);
const children = [];
let stopping = false;

const launch = (label, configDirectory, port, environment = {}) => {
    const child = spawn(
        process.execPath,
        [
            storybookCli,
            'dev',
            '--config-dir',
            configDirectory,
            '--port',
            String(port),
            '--no-open',
            '--disable-telemetry',
        ],
        {
            cwd: repositoryRoot,
            env: { ...process.env, ...environment },
            stdio: 'inherit',
        },
    );
    children.push(child);
    child.once('exit', (code) => {
        if (stopping || code === 0) return;
        console.error(`${label} exited with code ${code}.`);
        stop(code ?? 1);
    });
};

const stop = (code) => {
    if (stopping) return;
    stopping = true;
    for (const child of children) if (!child.killed) child.kill('SIGTERM');
    process.exitCode = code;
};
process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));

inventory.adapters.forEach((adapter, index) =>
    launch(adapter.metadata.displayName, rendererConfigDirectory, 6100 + index, {
        CRATIS_STORYBOOK_ADAPTER_ID: adapter.metadata.id,
    }),
);
launch('Composed Storybook manager', path.join(storybookRoot, 'manager'), 6006, {
    CRATIS_STORYBOOK_DEV_REFS: 'true',
});
console.log(
    `Composed manager: http://localhost:6006; ${inventory.adapters.length} isolated previews: ports 6100-${6099 + inventory.adapters.length}.`,
);
