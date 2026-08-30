// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import semver from 'semver';

const boundaryNames = ['minimum', 'current'];

export const readJson = (filePath) => {
    try {
        return JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new Error(
            `Could not parse renderer adapter matrix input '${filePath}': ${error instanceof Error ? error.message : String(error)}.`,
            { cause: error },
        );
    }
};

export const createFixture = (matrix, adapterKey, boundary) => {
    const adapter = matrix.adapters?.[adapterKey];
    if (!adapter) throw new Error(`Unknown renderer adapter '${adapterKey}'.`);
    if (!boundaryNames.includes(boundary)) {
        throw new Error(`Unknown renderer boundary '${boundary}'.`);
    }

    return {
        adapterKey,
        boundary,
        adapter,
        peers: {
            ...matrix.sharedPeers,
            ...matrix.boundaryPeers[boundary],
            ...adapter.boundaries[boundary],
        },
    };
};

const assertExactVersions = (versions, context) => {
    for (const [name, version] of Object.entries(versions)) {
        if (semver.valid(version) !== version) {
            throw new Error(`${context} pins ${name} to non-exact version '${version}'.`);
        }
    }
};

const assertSatisfies = (name, version, range, context) => {
    if (!semver.satisfies(version, range)) {
        throw new Error(
            `${context} pins ${name}@${version} outside declared peer range '${range}'.`,
        );
    }
};

const validateManifestClaims = (manifest, fixture, coreManifest) => {
    const context = `${fixture.adapterKey}/${fixture.boundary}`;
    const candidateVersions = {
        ...fixture.peers,
        [coreManifest.name]: coreManifest.version,
    };

    if (manifest.name !== fixture.adapter.workspace) {
        throw new Error(
            `${context} targets ${fixture.adapter.workspace}, but its manifest is ${manifest.name}.`,
        );
    }

    for (const [name, range] of Object.entries(manifest.peerDependencies ?? {})) {
        const version = candidateVersions[name];
        if (!version)
            throw new Error(`${context} does not pin required adapter peer '${name}'.`);
        assertSatisfies(name, version, range, context);

        if (name !== coreManifest.name && manifest.cratis?.upstream?.[name] !== range) {
            throw new Error(
                `${manifest.name} upstream claim for ${name} must exactly match peer range '${range}'.`,
            );
        }
    }

    for (const name of Object.keys(manifest.cratis?.upstream ?? {})) {
        if (!(name in (manifest.peerDependencies ?? {}))) {
            throw new Error(
                `${manifest.name} upstream claim '${name}' is not a declared peer.`,
            );
        }
    }
};

const validateCorePeers = (coreManifest, fixture) => {
    const optionalPeers = coreManifest.peerDependenciesMeta ?? {};
    for (const [name, range] of Object.entries(coreManifest.peerDependencies ?? {})) {
        if (optionalPeers[name]?.optional) continue;
        const version = fixture.peers[name];
        if (!version) {
            throw new Error(
                `${fixture.adapterKey}/${fixture.boundary} does not pin required Core peer '${name}'.`,
            );
        }
        assertSatisfies(
            name,
            version,
            range,
            `${fixture.adapterKey}/${fixture.boundary}`,
        );
    }
};

const validateMinimumBoundary = (manifest, fixture) => {
    for (const [name, range] of Object.entries(manifest.peerDependencies ?? {})) {
        if (name === '@cratis/components') continue;
        const declaredMinimum = semver.minVersion(range)?.version;
        const pinnedMinimum = fixture.peers[name];
        if (declaredMinimum !== pinnedMinimum) {
            throw new Error(
                `${fixture.adapterKey}/minimum must pin ${name} to declared floor ${declaredMinimum}, not ${pinnedMinimum}.`,
            );
        }
    }
};

const validateAlignedPackages = (fixture) => {
    const alignedPackages = fixture.adapter.alignedPackages ?? [];
    if (alignedPackages.length === 0) return;
    const versions = new Set(alignedPackages.map((name) => fixture.peers[name]));
    if (versions.size !== 1 || versions.has(undefined)) {
        throw new Error(
            `${fixture.adapterKey}/${fixture.boundary} must keep ${alignedPackages.join(', ')} aligned.`,
        );
    }
};

export const validateMatrix = (matrix, manifests) => {
    if (matrix.schemaVersion !== 1)
        throw new Error('Unsupported renderer adapter matrix schema.');
    const coreManifest = manifests['@cratis/components'];
    if (!coreManifest)
        throw new Error('The Core package manifest is required for matrix validation.');

    assertExactVersions(matrix.sharedPeers, 'shared peers');
    for (const boundary of boundaryNames) {
        assertExactVersions(
            matrix.boundaryPeers?.[boundary] ?? {},
            `${boundary} boundary peers`,
        );
    }

    for (const [adapterKey, adapter] of Object.entries(matrix.adapters ?? {})) {
        const manifest = manifests[adapter.workspace];
        if (!manifest) throw new Error(`Manifest for ${adapter.workspace} is required.`);
        for (const [packageName, specifier] of Object.entries(
            adapter.versionProbeSpecifiers ?? {},
        )) {
            if (!(packageName in (manifest.cratis?.upstream ?? {}))) {
                throw new Error(
                    `${adapterKey} version probe names non-upstream package '${packageName}'.`,
                );
            }
            if (typeof specifier !== 'string' || specifier.length === 0) {
                throw new Error(
                    `${adapterKey} version probe for ${packageName} is empty.`,
                );
            }
        }

        for (const boundary of boundaryNames) {
            assertExactVersions(
                adapter.boundaries?.[boundary] ?? {},
                `${adapterKey}/${boundary}`,
            );
            const fixture = createFixture(matrix, adapterKey, boundary);
            validateAlignedPackages(fixture);
            validateManifestClaims(manifest, fixture, coreManifest);
            validateCorePeers(coreManifest, fixture);
            if (boundary === 'minimum') validateMinimumBoundary(manifest, fixture);
        }
    }

    for (const omission of matrix.confirmedYarnPnpManifestOmissions ?? []) {
        if (omission.adapter && !matrix.adapters[omission.adapter]) {
            throw new Error(`PnP omission names unknown adapter '${omission.adapter}'.`);
        }
    }
};

export const yarnPackageExtensions = (matrix, fixture) => {
    const extensions = {};
    for (const omission of matrix.confirmedYarnPnpManifestOmissions ?? []) {
        if (omission.adapter && omission.adapter !== fixture.adapterKey) continue;
        const packageVersion = fixture.peers[omission.package];
        const dependencyVersion = fixture.peers[omission.dependency];
        if (!packageVersion || !dependencyVersion) {
            throw new Error(
                `PnP omission ${omission.package} -> ${omission.dependency} is not pinned by ${fixture.adapterKey}/${fixture.boundary}.`,
            );
        }
        extensions[`${omission.package}@${packageVersion}`] = {
            dependencies: { [omission.dependency]: dependencyVersion },
        };
    }
    return extensions;
};
