#!/usr/bin/env node
/* eslint-disable header/header */

if (process.argv.length < 3) {
    console.log('You have to specify what workspace task to run on all');
    console.log('\nUsage: run-task-on-workspaces [task] [arguments]');
    console.log('\nExamples of tasks: build|test|ci');
    process.exit(1);
}

const task = process.argv[2];
if (task === 'publish-version') {
    console.error(
        "The obsolete 'publish-version' workspace task is disabled. Releases require the reviewed, immutable-tarball process in RELEASE.md.",
    );
    process.exit(1);
}

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
console.log(`Performing '${task}' on workspaces`);
if (args.length > 0) console.log(`  Using args : ${args}`);
console.log('');

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
    if (!packageJson.scripts || !Object.hasOwn(packageJson.scripts, task)) {
        console.log(
            `Skipping workspace '${workspaceName}' - no script with name '${task}'`,
        );
        continue;
    }

    console.log(`Workspace '${workspaceName}' at '${workspaceRelativeLocation}'`);
    const result = spawn('yarn', [task], {
        cwd: workspaceAbsoluteLocation,
        encoding: 'utf8',
    });
    console.log(result.stdout ?? '');
    if (result.status !== 0) {
        console.log(`Error running task '${task}' on workspace '${workspaceName}'`);
        console.log(result.stderr ?? '');
        process.exit(1);
    }
}
