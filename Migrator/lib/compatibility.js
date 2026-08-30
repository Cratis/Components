// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundledManifestPath = path.join(packageDirectory, 'compat-manifest.json');
const migratorPackagePath = path.join(packageDirectory, 'package.json');

/** Validates the bundled release contract and the installed Components migration boundary. */
export function preflightCompatibility({
    cwd = process.cwd(),
    packageName = '@cratis/components',
} = {}) {
    const manifest = readJson(bundledManifestPath, 'bundled compatibility manifest');
    const migratorPackage = readJson(migratorPackagePath, 'migrator package manifest');
    validateBundledManifest(manifest, migratorPackage.version);

    const installedPackagePath = resolvePackageManifest(packageName, cwd);
    const installedPackage = readJson(
        installedPackagePath,
        `installed ${packageName} package manifest`,
    );
    if (installedPackage.name !== packageName) {
        throw new Error(
            `Resolved ${packageName} package manifest declares unexpected name '${installedPackage.name ?? '<missing>'}'.`,
        );
    }
    if (semver.valid(installedPackage.version) !== installedPackage.version) {
        throw new Error(
            `Installed ${packageName} has invalid version '${installedPackage.version ?? '<missing>'}'.`,
        );
    }

    const supportedWindow = Object.values(manifest.supportWindows).find(
        (window) =>
            ['source', 'target'].includes(window.migrationRole) &&
            semver.satisfies(installedPackage.version, window.components),
    );
    if (!supportedWindow) {
        const ranges = Object.values(manifest.supportWindows)
            .filter((window) => ['source', 'target'].includes(window.migrationRole))
            .map((window) => window.components)
            .join(' or ');
        throw new Error(
            `Installed ${packageName}@${installedPackage.version} is unsupported by this codemod. ` +
                `Allowed migration Components ranges: ${ranges}.`,
        );
    }
    const windowMigratorRange =
        typeof supportedWindow.tooling === 'string'
            ? supportedWindow.tooling
            : supportedWindow.tooling?.migrator;
    if (
        !semver.validRange(windowMigratorRange) ||
        !semver.satisfies(migratorPackage.version, windowMigratorRange)
    ) {
        throw new Error(
            `Migrator ${migratorPackage.version} is incompatible with the ${supportedWindow.migrationRole} support window tooling range '${windowMigratorRange ?? '<missing>'}'.`,
        );
    }

    return {
        manifest,
        migratorVersion: migratorPackage.version,
        componentsVersion: installedPackage.version,
        migrationRole: supportedWindow.migrationRole,
    };
}

/** Validates data that must remain true for the packed migrator to run safely. */
export function validateBundledManifest(manifest, migratorVersion) {
    if (!manifest || manifest.schemaVersion !== 2) {
        throw new Error('Bundled compatibility manifest has an unsupported schema.');
    }
    if (
        !['source-candidate', 'publication-authorized'].includes(manifest.releaseStatus)
    ) {
        throw new Error('Bundled compatibility manifest has an invalid releaseStatus.');
    }
    const migratorRange = manifest.toolingCompatibility?.migrator;
    if (!semver.validRange(migratorRange)) {
        throw new Error('Bundled compatibility manifest has an invalid migrator range.');
    }
    if (semver.valid(migratorVersion) !== migratorVersion) {
        throw new Error(`Migrator package has invalid version '${migratorVersion}'.`);
    }
    if (!semver.satisfies(migratorVersion, migratorRange)) {
        throw new Error(
            `Migrator package version ${migratorVersion} is outside bundled range '${migratorRange}'.`,
        );
    }

    const packageEntry = manifest.packages?.find(
        ({ name }) => name === '@cratis/components.migrator',
    );
    if (
        packageEntry?.version !== migratorVersion ||
        packageEntry?.independentRelease !== false ||
        !semver.satisfies(migratorVersion, packageEntry?.releaseMajorRange ?? '')
    ) {
        throw new Error(
            'Bundled compatibility manifest has stale migrator package metadata.',
        );
    }

    const windows = Object.values(manifest.supportWindows ?? {});
    const sourceWindows = windows.filter(
        ({ migrationRole }) => migrationRole === 'source',
    );
    const targetWindows = windows.filter(
        ({ migrationRole }) => migrationRole === 'target',
    );
    if (
        windows.length !== 2 ||
        sourceWindows.length !== 1 ||
        targetWindows.length !== 1 ||
        sourceWindows[0].components !== '>=3 <4' ||
        sourceWindows[0].migrationTarget !== '>=4 <5' ||
        targetWindows[0].components !== '>=4 <5' ||
        manifest.toolingCompatibility?.componentsCore !== '>=4 <5' ||
        windows.some((window) => {
            const toolingRange =
                typeof window.tooling === 'string'
                    ? window.tooling
                    : window.tooling?.migrator;
            return (
                !semver.validRange(window.components) || !semver.validRange(toolingRange)
            );
        })
    ) {
        throw new Error(
            'Bundled compatibility manifest has invalid migration support windows.',
        );
    }
}

function resolvePackageManifest(packageName, cwd) {
    try {
        const requireFromCwd = createRequire(
            path.join(path.resolve(cwd), 'package.json'),
        );
        return requireFromCwd.resolve(`${packageName}/package.json`);
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(
            `Could not resolve installed ${packageName} from '${path.resolve(cwd)}'. ` +
                `Install a supported Components 3 or Components 4 package before running the codemod. ${detail}`,
        );
    }
}

function readJson(filePath, description) {
    try {
        return JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Could not read ${description}: ${detail}`);
    }
}
