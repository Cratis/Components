// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/cleanup-pr-artifacts.yml', import.meta.url), 'utf8');
const cleanup = workflow.match(/^  cleanup:\n((?: {4}[^\n]*\n?)+)/m)?.[1];

test('the cleanup wrapper forwards only the two declared secrets without inheritance', () => {
    assert.doesNotMatch(workflow, /^\s*secrets:\s*inherit\b/m);
    assert.ok(cleanup, 'Expected the cleanup job');
    const secrets = cleanup.match(/^    secrets:\n((?: {6}[^\n]*\n?)+)/m)?.[1];
    assert.ok(secrets, 'Expected explicit cleanup secret mappings');
    assert.deepEqual(secrets.trim().split('\n').map(line => line.trim()).sort(), [
        'PACKAGE_CLEANUP_TOKEN: ${{ secrets.PACKAGE_CLEANUP_TOKEN }}',
        'PAT_WORKFLOWS: ${{ secrets.PAT_WORKFLOWS }}',
    ]);
});

test('the cleanup wrapper passes the event PR number to the shared workflow', () => {
    assert.ok(cleanup, 'Expected the cleanup job');
    assert.match(cleanup, /^    uses: Cratis\/Workflows\/\.github\/workflows\/cleanup-pr-artifacts\.yml@main$/m);
    assert.match(cleanup, /^    with:\n      pull_request: \$\{\{ github\.event\.pull_request\.number \}\}$/m);
});
