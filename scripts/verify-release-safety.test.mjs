// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { verifyReleaseSafety } from './verify-release-safety.mjs';

const repositoryDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
);

const createFixture = () => {
    const fixture = mkdtempSync(path.join(tmpdir(), 'cratis-release-safety-'));
    mkdirSync(path.join(fixture, '.github/workflows'), { recursive: true });
    for (const relativePath of [
        'package.json',
        'run-task-on-workspaces.js',
        'compat-manifest.json',
        '.github/workflows/publish.yml',
        '.github/workflows/javascript-build.yml',
    ]) {
        writeFileSync(
            path.join(fixture, relativePath),
            readFileSync(path.join(repositoryDirectory, relativePath)),
        );
    }
    return fixture;
};

const withFixture = (action) => {
    const fixture = createFixture();
    try {
        action(fixture);
    } finally {
        rmSync(fixture, { recursive: true, force: true });
    }
};

test('the checked-in release surfaces are fail closed', () => {
    assert.doesNotThrow(() => verifyReleaseSafety(repositoryDirectory));
});

test('the obsolete publish-version task fails before workspace discovery', () => {
    const result = spawnSync(
        process.execPath,
        ['run-task-on-workspaces.js', 'publish-version', '9.9.9'],
        { cwd: repositoryDirectory, encoding: 'utf8' },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /obsolete 'publish-version' workspace task is disabled/);
    assert.doesNotMatch(result.stdout, /Getting packages/);
});

test('the guard detects a reintroduced root publishing command', () => {
    withFixture((fixture) => {
        const packagePath = path.join(fixture, 'package.json');
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
        packageJson.scripts.publish = 'npm publish';
        writeFileSync(packagePath, JSON.stringify(packageJson));
        assert.throws(() => verifyReleaseSafety(fixture), /publishing commands/);
    });
});

test('the guard detects an automatic publish trigger', () => {
    withFixture((fixture) => {
        const workflowPath = path.join(fixture, '.github/workflows/publish.yml');
        const workflow = readFileSync(workflowPath, 'utf8').replace(
            '    workflow_dispatch: {}',
            '    workflow_dispatch: {}\n    push: {}',
        );
        writeFileSync(workflowPath, workflow);
        assert.throws(() => verifyReleaseSafety(fixture), /automatic trigger/);
    });
});

test('the guard detects release-evidence write permissions', () => {
    withFixture((fixture) => {
        const workflowPath = path.join(fixture, '.github/workflows/javascript-build.yml');
        const workflow = readFileSync(workflowPath, 'utf8').replace(
            '            contents: read\n',
            '            contents: read\n            id-token: write\n',
        );
        writeFileSync(workflowPath, workflow);
        assert.throws(
            () => verifyReleaseSafety(fixture),
            /must not request write permissions/,
        );
    });
});

test('the guard detects missing release-evidence retention', () => {
    withFixture((fixture) => {
        const workflowPath = path.join(fixture, '.github/workflows/javascript-build.yml');
        const workflow = readFileSync(workflowPath, 'utf8').replace(
            '                  retention-days: 30\n',
            '',
        );
        writeFileSync(workflowPath, workflow);
        assert.throws(() => verifyReleaseSafety(fixture), /explicit 30-day retention/);
    });
});

test('the guard detects compatibility publication authorization drift', () => {
    withFixture((fixture) => {
        const manifestPath = path.join(fixture, 'compat-manifest.json');
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        manifest.publicationEnabled = true;
        writeFileSync(manifestPath, JSON.stringify(manifest));
        assert.throws(() => verifyReleaseSafety(fixture), /publicationEnabled false/);
    });
});
