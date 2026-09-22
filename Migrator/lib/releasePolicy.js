// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import semver from 'semver';

export const adapterPackages = [
    '@cratis/components.conformance',
    '@cratis/components.mui',
    '@cratis/components.primereact',
    '@cratis/components.primereact10',
];

/** Only reviewed release families are supported; a future major needs an explicit policy. */
export function releasePolicy(version) {
    const major = semver.valid(version) && semver.major(version);
    if (![4, 5].includes(major)) {
        throw new Error(`Version '${version}' is outside supported release families 4 and 5.`);
    }
    return {
        major,
        range: `>=${major} <${major + 1}`,
        arcRange: major === 4 ? '>=20.3.1 <23' : '>=22.19.1 <23',
    };
}

export function supportWindows(version) {
    const { major } = releasePolicy(version);
    const target = (line) => ({
        components: `>=${line} <${line + 1}`,
        status: line === major ? 'current' : 'previous',
        migrationRole: 'target',
        rendererAbi: 1,
        coreProfile: 'core/v1',
        adapterProfile: 'stable-presentation/v1',
        tooling: {
            eslint: `>=${line} <${line + 1}`,
            // Migrator 5 retains the existing 3-to-4 transforms and recovery runs.
            migrator: `>=${line} <${major + 1}`,
        },
        adapters: Object.fromEntries(adapterPackages.map((name) => [name, `>=${line} <${line + 1}`])),
    });
    return {
        components3: {
            components: '>=3 <4',
            status: 'maintenance-security-critical',
            migrationRole: 'source',
            migrationTarget: '>=4 <5',
            tooling: `>=4 <${major + 1}`,
            eolAt: null,
            eolApprovedByOwners: false,
            ownerDecisionPolicy: 'Set and approve EOL no later than 12 months after Components 4 GA.',
        },
        components4: target(4),
        ...(major === 5 ? { components5: target(5) } : {}),
    };
}

/** Shared by generation and the packed Migrator, without changing any codemod. */
export function validateReleasePolicy(manifest, version) {
    const policy = releasePolicy(version);
    const tooling = manifest.toolingCompatibility;
    if (['componentsCore', 'eslint', 'migrator'].some((key) => tooling?.[key] !== policy.range)) {
        throw new Error(`Core ${policy.major} tooling compatibility must remain bounded to ${policy.range}.`);
    }
    if (JSON.stringify(manifest.supportWindows) !== JSON.stringify(supportWindows(version))) {
        throw new Error('The compatibility manifest has invalid migration support windows.');
    }
    for (const entry of manifest.packages ?? []) {
        if (entry.version !== version || entry.releaseMajorRange !== policy.range) {
            throw new Error(`${entry.name} must match the repository release version ${version} and family ${policy.range}.`);
        }
        const peers = entry.peerDependencies ?? {};
        if (adapterPackages.includes(entry.name) && peers['@cratis/components'] !== policy.range) {
            throw new Error(`${entry.name} must declare the matching Components peer family ${policy.range}.`);
        }
        for (const name of ['@cratis/arc', '@cratis/arc.react']) {
            if ((entry.name === '@cratis/components' || name in peers) && peers[name] !== policy.arcRange) {
                throw new Error(`${entry.name} must declare ${name} peer contract '${policy.arcRange}' for Components ${policy.major}.`);
            }
        }
    }
}
