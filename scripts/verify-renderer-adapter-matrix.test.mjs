// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, validateMatrix } from './lib/renderer-adapter-matrix.mjs';

const repositoryDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
);
const matrixPath = path.join(repositoryDirectory, 'scripts/renderer-adapter-matrix.json');

const loadInputs = () => {
    const matrix = readJson(matrixPath);
    const manifests = {};
    for (const manifestPath of [
        'Source/package.json',
        ...Object.values(matrix.adapters).map(
            (adapter) => `${adapter.directory}/package.json`,
        ),
    ]) {
        const manifest = readJson(path.join(repositoryDirectory, manifestPath));
        manifests[manifest.name] = manifest;
    }
    return { matrix, manifests };
};

const clone = (value) => structuredClone(value);

test('the checked-in renderer adapter matrix is valid', () => {
    const { matrix, manifests } = loadInputs();
    assert.doesNotThrow(() => validateMatrix(matrix, manifests));
});

test('an exact boundary version outside the adapter peer range fails before installation', () => {
    const { matrix, manifests } = loadInputs();
    const invalid = clone(matrix);
    invalid.adapters.mui.boundaries.current['@mui/material'] = '10.0.0';

    assert.throws(
        () => validateMatrix(invalid, manifests),
        /mui\/current pins @mui\/material@10\.0\.0 outside declared peer range/,
    );
});

test('a skewed PrimeReact 11 boundary fails before installation', () => {
    const { matrix, manifests } = loadInputs();
    const invalid = clone(matrix);
    invalid.adapters.primereact11.boundaries.minimum['@primereact/ui'] = '11.1.0';

    assert.throws(
        () => validateMatrix(invalid, manifests),
        /primereact11\/minimum must keep .* aligned/,
    );
});
