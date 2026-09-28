// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kernelSourcePaths } from '../../../ESLint/lib/kernelBoundary.js';
import { checkInventory } from '../../../scripts/lib/evidence-inventory.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const command = 'yarn generate-inventories';

export const checkKernelInventory = (update = false) => checkInventory(
    path.join(sourceRoot, 'scripts/kernel-inventory.json'),
    { kernelModules: kernelSourcePaths }, command, update,
);

export const checkExportInventory = (exportsMap, update = false) => checkInventory(
    path.join(sourceRoot, 'scripts/export-inventory.json'),
    { exportSubpaths: Object.keys(exportsMap ?? {}) }, command, update,
);
