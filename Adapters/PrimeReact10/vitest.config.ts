// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['for_*/**/when_*.ts', 'for_*/**/when_*.tsx'],
        setupFiles: ['./vitest.setup.ts'],
        isolate: true,
        fileParallelism: false,
    },
});
