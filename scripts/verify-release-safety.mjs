// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
);

export function verifyReleaseSafety(rootDirectory = repositoryDirectory) {
    const rootPackage = readJson(path.join(rootDirectory, 'package.json'));
    const publishScripts = Object.entries(rootPackage.scripts ?? {}).filter(
        ([name, command]) =>
            /publish/iu.test(name) || /(?:npm|yarn)\s+publish/iu.test(command),
    );
    if (publishScripts.length > 0) {
        throw new Error(
            `Root package.json must not expose publishing commands: ${publishScripts.map(([name]) => name).join(', ')}.`,
        );
    }
    if (rootPackage.devDependencies?.['edit-json-file']) {
        throw new Error(
            "Root package.json must not depend on obsolete 'edit-json-file'.",
        );
    }

    const workspaceRunner = fs.readFileSync(
        path.join(rootDirectory, 'run-task-on-workspaces.js'),
        'utf8',
    );
    const rejectionIndex = workspaceRunner.indexOf("task === 'publish-version'");
    const discoveryIndex = workspaceRunner.indexOf('rootPackageJson.workspaces');
    if (rejectionIndex < 0 || discoveryIndex < 0 || rejectionIndex > discoveryIndex) {
        throw new Error(
            "run-task-on-workspaces.js must reject 'publish-version' before workspace discovery.",
        );
    }
    if (/edit-json-file|npm['"`]\s*,\s*\[['"`]publish/iu.test(workspaceRunner)) {
        throw new Error(
            'The workspace runner still contains manifest mutation or npm publishing logic.',
        );
    }

    const executableFiles = collectExecutableFiles(rootDirectory).filter(
        (file) =>
            !file.endsWith('verify-release-safety.mjs') &&
            !file.endsWith('verify-release-safety.test.mjs'),
    );
    const directPublish = new RegExp(`\\b${'npm'}\\s+${'publish'}\\b`, 'iu');
    const spawnedPublish = new RegExp(
        `${'spawn'}(?:Sync)?\\s*\\([^)]*['\"]${'npm'}['\"][^)]*['\"]${'publish'}['\"]`,
        'isu',
    );
    for (const file of executableFiles) {
        const source = fs.readFileSync(file, 'utf8');
        if (directPublish.test(source) || spawnedPublish.test(source)) {
            throw new Error(
                `Executable publishing helper path found in ${path.relative(rootDirectory, file)}.`,
            );
        }
    }

    const workflow = fs.readFileSync(
        path.join(rootDirectory, '.github/workflows/publish.yml'),
        'utf8',
    );
    const activeWorkflow = workflow
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('#'))
        .join('\n');
    const triggerBlock = activeWorkflow.match(/^on:\s*\n([\s\S]*?)^permissions:/mu)?.[1];
    if (!triggerBlock || !/^\s+workflow_dispatch:\s*\{\}\s*$/mu.test(triggerBlock)) {
        throw new Error('publish.yml must retain a workflow_dispatch-only trigger.');
    }
    if (/^\s+(?:push|pull_request|schedule|workflow_run|release):/mu.test(triggerBlock)) {
        throw new Error('publish.yml must not contain an automatic trigger.');
    }
    const emptyPermissionBlocks =
        activeWorkflow.match(/^\s*permissions:\s*\{\}\s*$/gmu) ?? [];
    if (emptyPermissionBlocks.length < 2) {
        throw new Error(
            'publish.yml must retain empty top-level and job-level permissions.',
        );
    }
    if (
        /^\s+(?:id-token|contents|packages|deployments):\s*write\s*$/imu.test(
            activeWorkflow,
        ) ||
        /\$\{\{\s*secrets\./iu.test(activeWorkflow)
    ) {
        throw new Error('publish.yml must not request write permissions or credentials.');
    }
    if (!/^\s+exit 1\s*$/mu.test(activeWorkflow)) {
        throw new Error('publish.yml must remain a failing no-op.');
    }
    if (/^\s+uses:/mu.test(activeWorkflow)) {
        throw new Error(
            'publish.yml must not call actions while publication is blocked.',
        );
    }

    const compatibilityManifest = readJson(
        path.join(rootDirectory, 'compat-manifest.json'),
    );
    if (compatibilityManifest.publicationEnabled !== false) {
        throw new Error('compat-manifest.json must keep publicationEnabled false.');
    }
    if (compatibilityManifest.releaseStatus !== 'source-candidate') {
        throw new Error("compat-manifest.json must remain a 'source-candidate'.");
    }

    if (
        fs.existsSync(
            path.join(
                rootDirectory,
                '.github/workflows/auto-approve-publish-deployments.yml',
            ),
        )
    ) {
        throw new Error('The dormant auto-approval workflow must not exist.');
    }
}

function collectExecutableFiles(rootDirectory) {
    const files = [];
    const ignored = new Set([
        '.agents',
        '.ai',
        '.ai-work',
        '.claude',
        '.git',
        '.github',
        '.yarn',
        'dist',
        'node_modules',
    ]);
    const visit = (directory) => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            if (ignored.has(entry.name)) continue;
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) visit(entryPath);
            else if (/\.(?:js|mjs|cjs)$/u.test(entry.name)) files.push(entryPath);
        }
    };
    visit(rootDirectory);
    return files;
}

function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new Error(
            `Could not read ${filePath}: ${error instanceof Error ? error.message : String(error)}.`,
            { cause: error },
        );
    }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    try {
        verifyReleaseSafety();
        console.log(
            'Verified fail-closed release safety and disabled publication surfaces.',
        );
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
