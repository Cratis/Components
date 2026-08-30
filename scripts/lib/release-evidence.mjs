// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

export const archiveBindingProperties = Object.freeze({
    archiveFilename: 'urn:cratis:components:release-evidence:archive-filename',
    archiveSha512: 'urn:cratis:components:release-evidence:archive-sha512',
    commit: 'urn:cratis:components:release-evidence:commit',
});

const maximumCompressedArchiveBytes = 32 * 1024 * 1024;
const maximumDecompressedArchiveBytes = 32 * 1024 * 1024;

export function validateCommit(commit) {
    if (typeof commit !== 'string' || !/^[0-9a-f]{40}$/iu.test(commit)) {
        throw new Error('Commit must be exactly 40 hexadecimal characters.');
    }
    return commit.toLowerCase();
}

export function validateSafeFilename(filename, description = 'filename') {
    if (
        typeof filename !== 'string' ||
        !/^[a-z0-9][a-z0-9._-]*$/iu.test(filename) ||
        filename === '.' ||
        filename === '..' ||
        path.posix.basename(filename) !== filename ||
        path.win32.basename(filename) !== filename
    ) {
        throw new Error(`Unsafe ${description} '${String(filename)}'.`);
    }
    return filename;
}

export function packageArtifactStem(packageName, version) {
    if (
        typeof packageName !== 'string' ||
        !/^@[a-z0-9._-]+\/[a-z0-9._-]+$/iu.test(packageName)
    ) {
        throw new Error(`Unsafe package name '${String(packageName)}'.`);
    }
    if (
        typeof version !== 'string' ||
        !/^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/u.test(version)
    ) {
        throw new Error(`Unsafe package version '${String(version)}'.`);
    }
    return validateSafeFilename(
        `${packageName.slice(1).replace('/', '-')}-${version}`,
        'artifact stem',
    );
}

export function selectReleasePackages(compatibilityManifest) {
    const packageOrder = compatibilityManifest.gaScope?.publicPackages;
    if (!Array.isArray(packageOrder) || packageOrder.length === 0) {
        throw new Error('Compatibility metadata must define gaScope.publicPackages.');
    }
    const entries = compatibilityManifest.packages;
    if (!Array.isArray(entries)) {
        throw new Error('Compatibility metadata must define package entries.');
    }
    const entriesByName = new Map();
    for (const entry of entries) {
        if (!entry || typeof entry.name !== 'string' || entriesByName.has(entry.name)) {
            throw new Error(
                `Compatibility metadata contains an invalid or duplicate package entry '${entry?.name ?? '<missing>'}'.`,
            );
        }
        entriesByName.set(entry.name, entry);
    }
    const seen = new Set();
    return packageOrder.map((packageName) => {
        if (typeof packageName !== 'string' || seen.has(packageName)) {
            throw new Error(
                `gaScope.publicPackages contains an invalid or duplicate package '${String(packageName)}'.`,
            );
        }
        seen.add(packageName);
        const entry = entriesByName.get(packageName);
        if (!entry) {
            throw new Error(
                `gaScope package '${packageName}' has no compatibility entry.`,
            );
        }
        return entry;
    });
}

export function computeFileHashes(filePath) {
    const contents = fs.readFileSync(filePath);
    return {
        sha256: createHash('sha256').update(contents).digest('hex'),
        sha512: createHash('sha512').update(contents).digest('hex'),
    };
}

export function assertFileHashes(filePath, expected) {
    const actual = computeFileHashes(filePath);
    if (actual.sha256 !== expected.sha256 || actual.sha512 !== expected.sha512) {
        throw new Error(`Archive hash mismatch for '${path.basename(filePath)}'.`);
    }
}

const readJsonFile = (filePath, description) => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new Error(
            `Could not read ${description}: ${error instanceof Error ? error.message : String(error)}.`,
            { cause: error },
        );
    }
};

const readNullTerminated = (buffer) => {
    const end = buffer.indexOf(0);
    return buffer.subarray(0, end < 0 ? buffer.length : end).toString('utf8');
};

const readTarNumber = (buffer, field) => {
    if ((buffer[0] & 0x80) !== 0) {
        throw new Error(`Unsupported binary tar ${field}.`);
    }
    const value = readNullTerminated(buffer).trim();
    if (value === '') return 0;
    if (!/^[0-7]+$/u.test(value)) throw new Error(`Invalid tar ${field}.`);
    const parsed = Number.parseInt(value, 8);
    if (!Number.isSafeInteger(parsed) || parsed < 0)
        throw new Error(`Invalid tar ${field}.`);
    return parsed;
};

const validateTarChecksum = (header) => {
    const expected = readTarNumber(header.subarray(148, 156), 'checksum');
    let actual = 0;
    for (let index = 0; index < header.length; index += 1) {
        actual += index >= 148 && index < 156 ? 0x20 : header[index];
    }
    if (actual !== expected) throw new Error('Invalid tar header checksum.');
};

const parsePax = (buffer) => {
    const values = {};
    let offset = 0;
    while (offset < buffer.length) {
        const separator = buffer.indexOf(0x20, offset);
        if (separator < 0) throw new Error('Invalid PAX record.');
        const lengthText = buffer.subarray(offset, separator).toString('ascii');
        if (!/^[1-9][0-9]*$/u.test(lengthText))
            throw new Error('Invalid PAX record length.');
        const length = Number.parseInt(lengthText, 10);
        const recordEnd = offset + length;
        if (
            !Number.isSafeInteger(length) ||
            recordEnd > buffer.length ||
            buffer[recordEnd - 1] !== 0x0a
        ) {
            throw new Error('Invalid PAX record bounds.');
        }
        const record = buffer.subarray(separator + 1, recordEnd - 1).toString('utf8');
        const equals = record.indexOf('=');
        if (equals <= 0) throw new Error('Invalid PAX record value.');
        values[record.slice(0, equals)] = record.slice(equals + 1);
        offset = recordEnd;
    }
    return values;
};

function validateArchivePath(entryPath) {
    if (
        typeof entryPath !== 'string' ||
        entryPath.length === 0 ||
        entryPath.includes('\\') ||
        entryPath.includes('\0') ||
        path.posix.isAbsolute(entryPath) ||
        /^[a-z]:/iu.test(entryPath)
    ) {
        throw new Error(`Unsafe archive path '${String(entryPath)}'.`);
    }
    const segments = entryPath.split('/');
    if (
        segments.some((segment) => segment === '' || segment === '.' || segment === '..')
    ) {
        throw new Error(`Unsafe archive path '${entryPath}'.`);
    }
    return entryPath;
}

export function readPackedPackageJson(archivePath) {
    const compressedArchive = fs.readFileSync(archivePath);
    if (compressedArchive.length > maximumCompressedArchiveBytes) {
        throw new Error('Packed archive exceeds the compressed size limit.');
    }
    let archive;
    try {
        archive = gunzipSync(compressedArchive, {
            maxOutputLength: maximumDecompressedArchiveBytes,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            (error.code === 'ERR_BUFFER_TOO_LARGE' ||
                error.message.includes('larger than'))
        ) {
            throw new Error('Packed archive exceeds the decompressed size limit.', {
                cause: error,
            });
        }
        throw error;
    }
    let offset = 0;
    let longName;
    let pax = {};
    let packedManifest;
    let endMarkerFound = false;

    while (offset + 512 <= archive.length) {
        const header = archive.subarray(offset, offset + 512);
        if (header.every((byte) => byte === 0)) {
            if (archive.subarray(offset).some((byte) => byte !== 0)) {
                throw new Error('Tar archive contains non-zero data after its end marker.');
            }
            endMarkerFound = true;
            break;
        }
        validateTarChecksum(header);
        const size = readTarNumber(header.subarray(124, 136), 'entry size');
        const type = String.fromCharCode(header[156] || 0);
        const name = readNullTerminated(header.subarray(0, 100));
        const prefix = readNullTerminated(header.subarray(345, 500));
        const dataStart = offset + 512;
        const dataEnd = dataStart + size;
        const nextOffset = dataStart + Math.ceil(size / 512) * 512;
        if (dataEnd > archive.length || nextOffset > archive.length) {
            throw new Error('Tar entry exceeds archive bounds.');
        }
        const data = archive.subarray(dataStart, dataEnd);
        offset = nextOffset;

        if (type === 'L') {
            longName = readNullTerminated(data);
            continue;
        }
        if (type === 'x') {
            pax = parsePax(data);
            continue;
        }
        if (type === 'g') continue;

        const entryName = pax.path ?? longName ?? (prefix ? `${prefix}/${name}` : name);
        longName = undefined;
        pax = {};
        validateArchivePath(entryName);
        if (type === '1' || type === '2') {
            validateArchivePath(readNullTerminated(header.subarray(157, 257)));
        }
        if (entryName !== 'package/package.json') continue;
        if (type !== '\0' && type !== '0') {
            throw new Error('Packed package.json must be a regular archive entry.');
        }
        if (packedManifest)
            throw new Error('Archive contains duplicate package/package.json entries.');
        try {
            packedManifest = JSON.parse(data.toString('utf8'));
        } catch (error) {
            throw new Error(
                `Packed package.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}.`,
                { cause: error },
            );
        }
    }

    if (!endMarkerFound) throw new Error('Tar archive has no end marker.');
    if (!packedManifest) throw new Error('Archive is missing package/package.json.');
    return packedManifest;
}

export function validatePackedIdentity(packedPackage, compatibilityEntry) {
    if (
        packedPackage?.name !== compatibilityEntry.name ||
        packedPackage?.version !== compatibilityEntry.version ||
        packedPackage?.private === true ||
        packedPackage?.publishConfig?.access !== compatibilityEntry.packageAccess ||
        compatibilityEntry.packageAccess !== 'public' ||
        compatibilityEntry.private !== false
    ) {
        throw new Error(
            `Packed package identity/access does not match compatibility metadata for '${compatibilityEntry.name}'.`,
        );
    }
}

const componentPackageName = (component) => {
    if (typeof component?.name !== 'string') return undefined;
    return typeof component.group === 'string' && component.group.length > 0
        ? `${component.group}/${component.name}`
        : component.name;
};

const validateDependencyReferences = (sbom) => {
    if (!Array.isArray(sbom.dependencies))
        throw new Error('SBOM dependencies must be an array.');
    if (sbom.components !== undefined && !Array.isArray(sbom.components)) {
        throw new Error('SBOM components must be an array when present.');
    }
    const components = [sbom.metadata.component, ...(sbom.components ?? [])];
    const references = new Set();
    for (const component of components) {
        const reference = component?.['bom-ref'];
        if (
            typeof reference !== 'string' ||
            reference.length === 0 ||
            references.has(reference)
        ) {
            throw new Error('Every SBOM component must have a unique non-empty bom-ref.');
        }
        references.add(reference);
    }
    const dependencyRefs = new Set();
    for (const dependency of sbom.dependencies) {
        if (
            typeof dependency?.ref !== 'string' ||
            !references.has(dependency.ref) ||
            dependencyRefs.has(dependency.ref)
        ) {
            throw new Error(
                `SBOM contains an invalid dependency ref '${dependency?.ref ?? '<missing>'}'.`,
            );
        }
        dependencyRefs.add(dependency.ref);
        const dependsOn = dependency.dependsOn ?? [];
        if (
            !Array.isArray(dependsOn) ||
            dependsOn.some((reference) => !references.has(reference))
        ) {
            throw new Error(
                `SBOM dependency '${dependency.ref}' contains an invalid dependsOn reference.`,
            );
        }
        if (new Set(dependsOn).size !== dependsOn.length) {
            throw new Error(
                `SBOM dependency '${dependency.ref}' contains a duplicate dependsOn reference.`,
            );
        }
    }
    if (!dependencyRefs.has(sbom.metadata.component['bom-ref'])) {
        throw new Error('SBOM dependencies do not include the metadata component.');
    }
};

export function validateSbom(sbom, expected, { requireArchiveBinding = true } = {}) {
    if (sbom?.bomFormat !== 'CycloneDX' || sbom?.specVersion !== '1.6') {
        throw new Error('SBOM must be CycloneDX JSON specification version 1.6.');
    }
    const component = sbom.metadata?.component;
    if (!component || component.type !== 'library')
        throw new Error('SBOM metadata.component must be a library.');
    if (
        componentPackageName(component) !== expected.name ||
        component.version !== expected.version
    ) {
        throw new Error(
            `SBOM root component is not '${expected.name}@${expected.version}'.`,
        );
    }
    validateDependencyReferences(sbom);
    if (!requireArchiveBinding) return;

    validateSafeFilename(expected.tarball, 'SBOM archive filename');
    validateCommit(expected.commit);
    if (!/^[0-9a-f]{128}$/u.test(expected.sha512)) {
        throw new Error('Expected archive SHA-512 must be lowercase hexadecimal.');
    }
    if (!Array.isArray(component.hashes) || component.hashes.length === 0) {
        throw new Error('SBOM root component is missing hashes.');
    }
    const hashAlgorithms = new Set();
    for (const hash of component.hashes) {
        if (
            typeof hash?.alg !== 'string' ||
            typeof hash.content !== 'string' ||
            !/^[0-9a-f]+$/iu.test(hash.content) ||
            hashAlgorithms.has(hash.alg)
        ) {
            throw new Error('SBOM root component contains an invalid or duplicate hash.');
        }
        hashAlgorithms.add(hash.alg);
    }
    const sha512 = component.hashes.find(({ alg }) => alg === 'SHA-512')?.content;
    if (sha512 !== expected.sha512)
        throw new Error('SBOM root component SHA-512 does not match the archive.');
    if (!Array.isArray(component.properties))
        throw new Error('SBOM root component is missing archive-binding properties.');
    const properties = new Map();
    for (const property of component.properties) {
        if (
            typeof property?.name !== 'string' ||
            typeof property.value !== 'string' ||
            properties.has(property.name)
        ) {
            throw new Error(
                'SBOM root component contains an invalid or duplicate property.',
            );
        }
        properties.set(property.name, property.value);
    }
    for (const [propertyName, expectedValue] of [
        [archiveBindingProperties.archiveFilename, expected.tarball],
        [archiveBindingProperties.archiveSha512, expected.sha512],
        [archiveBindingProperties.commit, expected.commit],
    ]) {
        if (properties.get(propertyName) !== expectedValue) {
            throw new Error(
                `SBOM root component is missing archive binding '${propertyName}'.`,
            );
        }
    }
    if (sbom.serialNumber !== undefined || sbom.metadata.timestamp !== undefined) {
        throw new Error(
            'Reproducible SBOM must not contain a serial number or timestamp.',
        );
    }
}

export function bindSbomToArchive(sbom, binding) {
    validateSbom(sbom, binding, { requireArchiveBinding: false });
    const component = sbom.metadata.component;
    component.name = binding.name;
    delete component.group;
    component.version = binding.version;
    component.hashes = [
        ...(component.hashes ?? []).filter(({ alg }) => alg !== 'SHA-512'),
        { alg: 'SHA-512', content: binding.sha512 },
    ].sort(({ alg: left }, { alg: right }) => left.localeCompare(right));
    const bindingNames = new Set(Object.values(archiveBindingProperties));
    component.properties = [
        ...(component.properties ?? []).filter(({ name }) => !bindingNames.has(name)),
        { name: archiveBindingProperties.archiveFilename, value: binding.tarball },
        { name: archiveBindingProperties.archiveSha512, value: binding.sha512 },
        { name: archiveBindingProperties.commit, value: binding.commit },
    ].sort(({ name: left }, { name: right }) => left.localeCompare(right));
    delete sbom.serialNumber;
    delete sbom.metadata.timestamp;
    validateSbom(sbom, binding);
    return sbom;
}

export function validateReleaseEvidenceIndex(index, outputDirectory) {
    if (index?.schemaVersion !== 1 || index.publicationEnabled !== false) {
        throw new Error(
            'Release evidence index must be schema 1 and publication-disabled.',
        );
    }
    validateCommit(index.commit);
    if (!Array.isArray(index.packages) || index.packages.length === 0) {
        throw new Error('Release evidence index must contain packages.');
    }
    for (const packageEvidence of index.packages) {
        validateSafeFilename(packageEvidence.tarball, 'tarball filename');
        validateSafeFilename(packageEvidence.sbom, 'SBOM filename');
        const archivePath = path.join(outputDirectory, packageEvidence.tarball);
        assertFileHashes(archivePath, packageEvidence);
        const sbom = readJsonFile(
            path.join(outputDirectory, packageEvidence.sbom),
            `${packageEvidence.name} SBOM`,
        );
        validateSbom(sbom, {
            name: packageEvidence.name,
            version: packageEvidence.version,
            sha512: packageEvidence.sha512,
            tarball: packageEvidence.tarball,
            commit: index.commit,
        });
    }
}
