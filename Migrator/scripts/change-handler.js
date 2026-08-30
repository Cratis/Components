#!/usr/bin/env node
// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { transformChangeHandlers } from '../lib/changeHandlerTransform.js';
import { runTransformCli } from '../lib/runTransformCli.js';

process.exitCode = runTransformCli(process.argv.slice(2), {
    command: 'cratis-components-change-handler',
    description:
        'Migrates structurally-proven Components event-wrapper callbacks to semantic value callbacks. Ambiguous handlers are annotated and reported for manual review.',
    transform: transformChangeHandlers,
});
