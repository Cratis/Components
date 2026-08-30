#!/usr/bin/env node
// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { transformButtonVariantTone } from '../lib/buttonVariantToneTransform.js';
import { runTransformCli } from '../lib/runTransformCli.js';

process.exitCode = runTransformCli(process.argv.slice(2), {
    command: 'cratis-components-button-variant-tone',
    description:
        'Migrates deprecated Button text/link/outlined/rounded/severity JSX props to variant/tone/shape. Uncertain cases are annotated and reported for manual review.',
    transform: transformButtonVariantTone,
});
