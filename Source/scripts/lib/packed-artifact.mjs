// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Shared "pack the real publish artifact into a scratch consumer" plumbing, factored out
 * of `verify-public-types.mjs` so `verify-no-pixi-consumer.mjs` and
 * `verify-spatial-consumer.mjs` can build their own scratch `node_modules` - one that
 * deliberately withholds `pixi.js`, one that deliberately installs it - without
 * duplicating the tar-reading/extraction logic or diverging from how `verify-public-types.mjs`
 * itself resolves the packed artifact. No new dependency: this is a minimal ustar/PAX
 * gzip reader, the same approach `verify-public-types.mjs` already uses instead of shelling
 * out to a platform `tar`.
 */

import { spawnSync } from 'node:child_process';
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    realpathSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

const readNullTerminated = (buffer) => {
    const end = buffer.indexOf(0);
    return buffer.subarray(0, end < 0 ? buffer.length : end).toString('utf8');
};

const readOctal = (buffer) => {
    const value = readNullTerminated(buffer).trim();
    return value ? Number.parseInt(value, 8) : 0;
};

const parsePax = (buffer) => {
    const values = {};
    let offset = 0;
    while (offset < buffer.length) {
        const separator = buffer.indexOf(0x20, offset);
        if (separator < 0) break;
        const length = Number.parseInt(
            buffer.subarray(offset, separator).toString('ascii'),
            10,
        );
        if (!Number.isFinite(length) || length <= 0) break;
        const record = buffer
            .subarray(separator + 1, offset + length - 1)
            .toString('utf8');
        const equals = record.indexOf('=');
        if (equals >= 0) values[record.slice(0, equals)] = record.slice(equals + 1);
        offset += length;
    }
    return values;
};

/** Reads a gzip-compressed ustar/PAX archive without requiring a platform `tar` executable. */
export function readTarEntries(archivePath) {
    const archive = gunzipSync(readFileSync(archivePath));
    const entries = new Map();
    let offset = 0;
    let longName;
    let pax = {};

    while (offset + 512 <= archive.length) {
        const header = archive.subarray(offset, offset + 512);
        if (header.every((byte) => byte === 0)) break;

        const size = readOctal(header.subarray(124, 136));
        const type = String.fromCharCode(header[156] || 0);
        const name = readNullTerminated(header.subarray(0, 100));
        const prefix = readNullTerminated(header.subarray(345, 500));
        const dataStart = offset + 512;
        const data = archive.subarray(dataStart, dataStart + size);
        offset = dataStart + Math.ceil(size / 512) * 512;

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
        if ((type === '\0' || type === '0') && entryName) {
            entries.set(entryName, Buffer.from(data));
        }
    }
    return entries;
}

/** Extracts every `package/...` entry of a read tarball under `destination`. */
export function extractPackedArtifact(entries, destination) {
    const packagePrefix = 'package/';
    for (const [entryName, content] of entries) {
        if (!entryName.startsWith(packagePrefix)) continue;
        const relative = entryName.slice(packagePrefix.length);
        if (!relative) continue;
        const target = path.resolve(destination, relative);
        if (!target.startsWith(`${path.resolve(destination)}${path.sep}`)) {
            throw new Error(`Unsafe archive path '${entryName}'.`);
        }
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, content);
    }
}

/** Runs `yarn pack` for `packageDir`, writing the tarball into `scratchRoot`. Returns its path and parsed entries. */
export function packArtifact(packageDir, scratchRoot) {
    const tgzPath = path.join(scratchRoot, 'cratis-components.tgz');
    const result = spawnSync('yarn', ['pack', '--out', tgzPath], {
        cwd: packageDir,
        encoding: 'utf8',
        timeout: 180_000,
    });
    if (result.status !== 0) {
        throw new Error(`\`yarn pack\` failed:\n${result.stderr || result.stdout}`);
    }
    if (!existsSync(tgzPath))
        throw new Error(`\`yarn pack\` did not produce ${tgzPath}.`);
    return { tgzPath, entries: readTarEntries(tgzPath) };
}

const linkInstalledEntry = (source, destination, directoryEntry) => {
    if (process.platform === 'win32') {
        if (directoryEntry.isFile()) copyFileSync(source, destination);
        else symlinkSync(realpathSync(source), destination, 'junction');
        return;
    }
    symlinkSync(source, destination, directoryEntry.isDirectory() ? 'dir' : 'file');
};

/**
 * Builds a scratch `node_modules` for a consumer fixture: the packed artifact extracted
 * for real under `@cratis/components`, every other already-installed monorepo dependency
 * borrowed by symlink (no network), and `excludeTopLevel`/`excludeScoped` entries omitted
 * entirely so their absence is a genuine `ERR_MODULE_NOT_FOUND`, not a symlink nobody
 * imports.
 *
 * @param monorepoRoot Absolute path to the Yarn workspace root (its `node_modules` is the donor).
 * @param scratchRoot Absolute path to this fixture's scratch directory.
 * @param packedEntries The `Map` returned by {@link packArtifact}'s `entries`.
 * @param excludeTopLevel Top-level `node_modules/<name>` entries to omit (e.g. `pixi.js`).
 * @param excludeScoped Map of scope name (e.g. `@pixi`, `@webgpu`) to `true` to omit the whole scope.
 * @returns The scratch `node_modules` path and the real (non-symlinked) packed-components directory.
 */
export function buildScratchNodeModules({
    monorepoRoot,
    scratchRoot,
    packedEntries,
    excludeTopLevel = new Set(),
    excludeScoped = new Set(),
}) {
    const scratchNodeModules = path.join(scratchRoot, 'node_modules');
    mkdirSync(scratchNodeModules, { recursive: true });

    const rootNodeModules = path.join(monorepoRoot, 'node_modules');
    if (!existsSync(rootNodeModules)) {
        throw new Error(
            `${rootNodeModules} does not exist. Run \`yarn install\` at the repo root first.`,
        );
    }

    for (const entry of readdirSync(rootNodeModules, { withFileTypes: true })) {
        if (entry.name === '@cratis' || entry.name === '.bin') continue;
        if (entry.name.startsWith('@') && excludeScoped.has(entry.name)) continue;
        if (excludeTopLevel.has(entry.name)) continue;
        linkInstalledEntry(
            path.join(rootNodeModules, entry.name),
            path.join(scratchNodeModules, entry.name),
            entry,
        );
    }

    const scratchCratisScope = path.join(scratchNodeModules, '@cratis');
    mkdirSync(scratchCratisScope, { recursive: true });
    const rootCratisScope = path.join(rootNodeModules, '@cratis');
    for (const entry of readdirSync(rootCratisScope, { withFileTypes: true })) {
        if (entry.name === 'components') continue; // overridden below with the packed artifact.
        linkInstalledEntry(
            path.join(rootCratisScope, entry.name),
            path.join(scratchCratisScope, entry.name),
            entry,
        );
    }

    const packedComponentsDir = path.join(scratchCratisScope, 'components');
    mkdirSync(packedComponentsDir, { recursive: true });
    extractPackedArtifact(packedEntries, packedComponentsDir);

    return { scratchNodeModules, packedComponentsDir };
}
