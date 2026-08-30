#!/usr/bin/env node
// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { runTransformCli } from '../lib/runTransformCli.js';
import { transformSource } from '../lib/transform.js';

process.exitCode = runTransformCli(process.argv.slice(2), {
    command: 'cratis-components-remove-root-namespace-imports',
    description:
        'Rewrites Components 3 root namespace imports and named re-exports to Components 4 explicit subpaths. Unsupported whole-package and unknown forms are reported without guessing.',
    transform: (file, text, { packageName }) =>
        transformSource(file, text, { packageName }),
});
