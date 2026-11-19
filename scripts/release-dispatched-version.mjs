// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function validateVersion(version) {
    if (!stableVersion.test(version)) throw new Error(`'${version}' is not a version.`);
    const safeComponents = version.split('.').every(component => Number.isSafeInteger(Number(component)));
    if (!safeComponents) throw new Error('Version components must not exceed Number.MAX_SAFE_INTEGER.');
}

function compareVersions(left, right) {
    const leftParts = left.split('.').map(BigInt);
    const rightParts = right.split('.').map(BigInt);
    for (let index = 0; index < leftParts.length; index++) {
        if (leftParts[index] > rightParts[index]) return 1;
        if (leftParts[index] < rightParts[index]) return -1;
    }
    return 0;
}

function githubApi(repository) {
    return (path, { body, paginate = false } = {}) => {
        const args = ['api', `repos/${repository}/${path}`];
        if (paginate) args.push('--paginate', '--slurp');
        if (body) args.push('--method', 'POST', '--input', '-');
        const result = JSON.parse(execFileSync('gh', args, {
            encoding: 'utf8', input: body ? JSON.stringify(body) : undefined,
        }));
        return paginate ? result.flat() : result;
    };
}

function tagCommit(object, api) {
    for (let depth = 0; depth < 10; depth++) {
        if (object.type === 'commit') return object.sha;
        if (object.type !== 'tag') break;
        object = api(`git/tags/${object.sha}`).object;
    }
    throw new Error('Could not resolve the release tag to a commit.');
}

function verifyTag(ref, sha, api) {
    if (tagCommit(ref.object, api) !== sha) {
        throw new Error(`${ref.ref} already exists on another commit; refusing to publish.`);
    }
}

function verifyRelease(release, tag) {
    const invalid = [release.tag_name !== tag, release.draft, release.prerelease].some(Boolean);
    if (invalid) {
        throw new Error(`${tag} does not have a published stable GitHub release; refusing to publish.`);
    }
}

function checkVersionOrder(version, tags) {
    // The requested tag is already verified above; exclude it to permit an idempotent retry.
    const otherTags = tags.filter(tag => tag.ref !== `refs/tags/v${version}`);
    const versions = otherTags.map(tag => tag.ref.replace('refs/tags/v', '')).filter(tag => stableVersion.test(tag));
    const latest = versions.reduce((highest, candidate) => compareVersions(candidate, highest) > 0 ? candidate : highest, '0.0.0');
    if (compareVersions(version, latest) <= 0) {
        throw new Error(`${version} must be greater than latest tag v${latest}; only a same-commit retry of that tag is allowed.`);
    }
}

export function releaseDispatchedVersion({ version, sha, ref: dispatchRef, repository, notes = '' }, api = githubApi(repository)) {
    if (dispatchRef !== 'refs/heads/main') throw new Error('Dispatched publishing is only allowed from refs/heads/main.');
    if (version === '0.0.0') return { version: '', 'should-publish': false, reason: 'placeholder-version' };
    validateVersion(version);
    if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('The dispatched commit SHA is invalid.');

    const tag = `v${version}`;
    const ref = `refs/tags/${tag}`;
    const tags = api('git/matching-refs/tags/v', { paginate: true });
    const existing = tags.find(candidate => candidate.ref === ref);
    if (existing) verifyTag(existing, sha, api);
    checkVersionOrder(version, tags);

    const releases = api('releases', { paginate: true });
    const existingRelease = releases.find(release => release.tag_name === tag);
    if (existingRelease) verifyRelease(existingRelease, tag);
    // Reserve the immutable version before creating its release or allowing npm to publish anything.
    // A concurrent ref creation fails closed; never move a tag, even on a retry.
    if (!existing) api('git/refs', { body: { ref, sha } });
    if (!existingRelease) {
        api('releases', { body: {
            tag_name: tag, name: `Release ${tag}`, body: notes.trim(),
            generate_release_notes: notes.trim() === '', prerelease: false, target_commitish: sha,
        } });
    }
    verifyTag(api(`git/ref/tags/${tag}`), sha, api);
    verifyRelease(api(`releases/tags/${tag}`), tag);
    return { version, 'should-publish': true, reason: 'release' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        const outputs = releaseDispatchedVersion({
            version: process.env.VERSION, sha: process.env.GITHUB_SHA, ref: process.env.DISPATCH_REF,
            repository: process.env.GITHUB_REPOSITORY, notes: process.env.RELEASE_NOTES,
        });
        appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(outputs).map(([key, value]) => `${key}=${value}\n`).join(''));
    } catch (error) {
        console.error(`Dispatch release refused: ${error.message}`);
        process.exitCode = 1;
    }
}
