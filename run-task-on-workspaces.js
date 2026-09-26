#!/usr/bin/env node
// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

if (process.argv.length < 3) {
    console.log('You have to specify what workspace task to run on all');
    console.log('\nUsage: run-task-on-workspaces [task] [arguments]');
    console.log('\nExamples of tasks: build|test|ci');
    process.exit(1);
}

const task = process.argv[2];

const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawnSync;
const rootPackageJson = require('./package.json');
const glob = require('glob').sync;

const readJson = (file) => {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        console.error(
            `Could not read '${file}': ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
    }
};

const workspaces = {};
const distFolder = `dist${path.sep}`;
for (const workspaceDef of rootPackageJson.workspaces) {
    console.log(`Getting packages for workspace definition '${workspaceDef}' \n`);
    const pattern = path.join(workspaceDef, '**', 'package.json');
    const packages = glob(pattern, {
        cwd: `${process.cwd()}`,
        ignore: [`**${path.sep}${distFolder}**`, '**/node_modules/**'],
    });

    if (packages.length === 0) {
        console.error(
            `  No packages found for workspace definition '${workspaceDef}' \n`,
        );
        process.exit(1);
    }

    packages.forEach((packageManifest) => {
        const packageJson = readJson(packageManifest);
        workspaces[packageJson.name] = path.dirname(packageManifest);
        console.log(
            `Including workspace '${packageJson.name}' at '${workspaces[packageJson.name]}'`,
        );
    });
}

console.log('');
const args = process.argv.slice(3);
const isPublishing = task === 'publish-version';
if (
    isPublishing &&
    (args.length !== 1 ||
        !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(args[0]))
) {
    console.error('publish-version requires one exact semantic version.');
    process.exit(1);
}
const releaseVersion = isPublishing ? args[0] : undefined;

console.log(`Performing '${task}' on workspaces`);
if (args.length > 0) console.log(`  Using args : ${args}`);
console.log('');

if (isPublishing) {
    const result = spawn(process.execPath, [path.join(__dirname, 'scripts/prepare-release-version.mjs'), releaseVersion], {
        cwd: process.cwd(),
        stdio: 'inherit',
    });
    if (result.status !== 0) {
        console.error('Error preparing release version. Publication stopped.');
        if (result.error) console.error(result.error);
        if (result.signal) console.error(`Terminated by ${result.signal}.`);
        process.exit(1);
    }
}

for (const workspaceName in workspaces) {
    const workspaceRelativeLocation = workspaces[workspaceName];
    const workspaceAbsoluteLocation = path.join(process.cwd(), workspaceRelativeLocation);
    const packageJsonFile = path.join(workspaceAbsoluteLocation, 'package.json');
    if (!fs.existsSync(packageJsonFile)) continue;

    const packageJson = readJson(packageJsonFile);
    if (packageJson.private === true) {
        console.log(
            `Workspace private '${workspaceName}' at '${workspaceRelativeLocation}'`,
        );
        continue;
    }
    if (isPublishing) {
        if (packageJson.version !== releaseVersion) {
            console.error(
                `Workspace '${workspaceName}' at '${workspaceRelativeLocation}' has version '${packageJson.version ?? '<missing>'}', expected '${releaseVersion}'. Publication stopped.`,
            );
            process.exitCode = 1;
            break;
        }
        console.log(
            `Publishing workspace '${workspaceName}' at '${workspaceRelativeLocation}' as ${releaseVersion}`,
        );
        const result = spawn('npm', ['publish', '--provenance', '--access', 'public'], {
            cwd: workspaceAbsoluteLocation,
            stdio: 'inherit',
        });
        if (result.status !== 0) {
            console.error(
                `Error publishing workspace '${workspaceName}'. Publication stopped.`,
            );
            if (result.error) console.error(result.error);
            if (result.signal) console.error(`Terminated by ${result.signal}.`);
            process.exitCode = 1;
            break;
        }
        continue;
    }

    if (!packageJson.scripts || !Object.hasOwn(packageJson.scripts, task)) {
        console.log(
            `Skipping workspace '${workspaceName}' - no script with name '${task}'`,
        );
        continue;
    }

    console.log(`Workspace '${workspaceName}' at '${workspaceRelativeLocation}'`);
    // Stream both outputs while the child runs: buffering truncates large logs and
    // a forced process.exit can discard the queued failure details in CI pipes.
    const result = spawn('yarn', [task], {
        cwd: workspaceAbsoluteLocation,
        stdio: 'inherit',
    });
    if (result.status !== 0) {
        console.error(`Error running task '${task}' on workspace '${workspaceName}'`);
        if (result.error) console.error(result.error);
        if (result.signal) console.error(`Terminated by ${result.signal}.`);
        process.exitCode = 1;
        break;
    }
}
