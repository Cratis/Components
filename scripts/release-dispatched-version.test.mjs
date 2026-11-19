// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { releaseDispatchedVersion } from './release-dispatched-version.mjs';

const sha = 'a'.repeat(40);
const otherSha = 'b'.repeat(40);
const input = { version: '4.44.3', sha, ref: 'refs/heads/main', repository: 'Cratis/Components', notes: 'Release notes' };
const refFor = (version, commit = sha) => ({ ref: `refs/tags/v${version}`, object: { type: 'commit', sha: commit } });
const releaseFor = version => ({ tag_name: `v${version}`, draft: false, prerelease: false });

function fixture({ tags = [refFor('4.44.2')], releases = [], failAt } = {}) {
    const writes = [];
    const calls = [];
    const api = (path, { body } = {}) => {
        calls.push(path);
        if (path === failAt) throw new Error(`API refused ${path}`);
        if (body) writes.push({ path, body });
        if (path === 'git/matching-refs/tags/v') return tags;
        if (path === 'git/refs') {
            const ref = refFor(body.ref.replace('refs/tags/v', ''), body.sha);
            tags.push(ref);
            return ref;
        }
        if (path === 'releases' && body) {
            const release = { ...body, draft: false };
            releases.push(release);
            return release;
        }
        if (path === 'releases') return releases;
        if (path === `git/ref/tags/v${input.version}`) return tags.find(tag => tag.ref === `refs/tags/v${input.version}`);
        if (path === `releases/tags/v${input.version}`) return releases.find(release => release.tag_name === `v${input.version}`);
        if (path === `git/tags/${otherSha}`) return { object: { type: 'commit', sha } };
        assert.fail(`Unexpected API call: ${path}`);
    };
    return { api, writes, calls };
}

function expectRefusal(options, message, request = input) {
    const { api, writes } = fixture(options);
    assert.throws(() => releaseDispatchedVersion(request, api), message);
    assert.deepEqual(writes, [], 'must refuse before creating tags or releases');
}

test('new version reserves its tag at the dispatched SHA, creates the release, then enables publishing', () => {
    const { api, writes, calls } = fixture();
    assert.deepEqual(releaseDispatchedVersion(input, api), { version: input.version, 'should-publish': true, reason: 'release' });
    assert.deepEqual(writes, [
        { path: 'git/refs', body: { ref: 'refs/tags/v4.44.3', sha } },
        { path: 'releases', body: { tag_name: 'v4.44.3', name: 'Release v4.44.3', body: 'Release notes',
            generate_release_notes: false, prerelease: false, target_commitish: sha } },
    ]);
    assert.deepEqual(calls.slice(-2), ['git/ref/tags/v4.44.3', 'releases/tags/v4.44.3']);
});

test('latest tag and release on the same commit are reused without writes', () => {
    const { api, writes } = fixture({ tags: [refFor(input.version)], releases: [releaseFor(input.version)] });
    assert.equal(releaseDispatchedVersion(input, api)['should-publish'], true);
    assert.deepEqual(writes, []);
});

test('same-commit tag without a release creates only the missing release', () => {
    const { api, writes } = fixture({ tags: [refFor(input.version)] });
    assert.equal(releaseDispatchedVersion(input, api)['should-publish'], true);
    assert.deepEqual(writes.map(write => write.path), ['releases']);
});

test('annotated tags are resolved to their commit before being reused', () => {
    const tag = { ref: 'refs/tags/v4.44.3', object: { type: 'tag', sha: otherSha } };
    const { api, writes } = fixture({ tags: [tag], releases: [releaseFor(input.version)] });
    assert.equal(releaseDispatchedVersion(input, api)['should-publish'], true);
    assert.deepEqual(writes, []);
});

test('tag on another commit refuses even when the release already exists', () => {
    expectRefusal({ tags: [refFor(input.version, otherSha)], releases: [releaseFor(input.version)] }, /another commit/);
});

test('a version below the latest tag refuses, including a same-commit retry of an older tag', () => {
    expectRefusal({ tags: [refFor('4.45.0')] }, /greater than latest tag v4.45.0/);
    expectRefusal({ tags: [refFor(input.version), refFor('4.45.0')] }, /greater than latest tag/);
});

test('version ordering is numeric and considers all returned tags, not API order', () => {
    const { api } = fixture({ tags: [refFor('4.9.9'), refFor('4.44.2'), refFor('4.10.0')] });
    assert.equal(releaseDispatchedVersion(input, api)['should-publish'], true);
});

test('placeholder is a no-op; malformed versions and SHAs refuse without API calls', () => {
    const api = () => assert.fail('API must not be called');
    assert.equal(releaseDispatchedVersion({ ...input, version: '0.0.0' }, api)['should-publish'], false);
    for (const version of ['v4.44.3', '04.44.3', '4.44.3-beta', '4.44.3\n', '$(command)', '']) {
        assert.throws(() => releaseDispatchedVersion({ ...input, version }, api), /not a version/);
    }
    assert.throws(() => releaseDispatchedVersion({ ...input, sha: 'main' }, api), /SHA is invalid/);
});

test('non-main and missing refs refuse before API calls, including placeholder dispatches', () => {
    const api = () => assert.fail('API must not be called');
    for (const ref of ['refs/heads/feature', 'refs/heads/support/4', 'refs/tags/v4.44.3', '', undefined]) {
        for (const version of [input.version, '0.0.0']) {
            assert.throws(() => releaseDispatchedVersion({ ...input, ref, version }, api), /only allowed from refs\/heads\/main/);
        }
    }
});

test('unsafe numeric components refuse before API calls; the safe-integer boundary passes validation', () => {
    const api = () => assert.fail('API must not be called');
    for (const version of ['9007199254740992.0.0', '4.9007199254740992.0', '4.44.9007199254740992']) {
        assert.throws(() => releaseDispatchedVersion({ ...input, version }, api), /MAX_SAFE_INTEGER/);
    }
    const readApi = () => { throw new Error('Validated input reached API'); };
    assert.throws(() => releaseDispatchedVersion({ ...input, version: '9007199254740991.0.0' }, readApi), /Validated input reached API/);
});

test('draft and prerelease collisions refuse before writes', () => {
    for (const field of ['draft', 'prerelease']) {
        expectRefusal({ releases: [{ ...releaseFor(input.version), [field]: true }] }, /published stable GitHub release/);
    }
});

test('API read failures and concurrent tag-creation failures never enable publishing', () => {
    for (const failAt of ['git/matching-refs/tags/v', 'releases', 'git/refs']) {
        expectRefusal({ failAt }, /API refused/);
    }
});

test('release-creation failure leaves only a reserved tag and refuses publishing', () => {
    const { api, writes } = fixture({ failAt: 'releases/tags/v4.44.3' });
    assert.throws(() => releaseDispatchedVersion(input, api), /API refused/);
    assert.deepEqual(writes.map(write => write.path), ['git/refs', 'releases']);
    const failedCreate = fixture();
    assert.throws(() => releaseDispatchedVersion(input, (path, options) => {
        if (path === 'releases' && options?.body) throw new Error('Release creation failed');
        return failedCreate.api(path, options);
    }), /Release creation failed/);
    assert.deepEqual(failedCreate.writes.map(write => write.path), ['git/refs']);
});

test('a moved tag or unverified release after creation refuses publishing', () => {
    for (const corruptedPath of ['git/ref/tags/v4.44.3', 'releases/tags/v4.44.3']) {
        const { api } = fixture();
        assert.throws(() => releaseDispatchedVersion(input, (path, options) => {
            if (path === corruptedPath) return path.startsWith('git/') ? refFor(input.version, otherSha) : { tag_name: 'wrong' };
            return api(path, options);
        }), /refusing to publish/);
    }
});

test('empty notes request generated notes and an existing release on the commit does not suppress a new version', () => {
    const { api, writes } = fixture({ releases: [releaseFor('4.44.2')] });
    releaseDispatchedVersion({ ...input, notes: '  ' }, api);
    assert.equal(writes[1].body.generate_release_notes, true);
});

test('workflow routes dispatch through the script and npm through verified release outputs only', () => {
    const workflow = readFileSync(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8');
    assert.match(workflow, /name: Release dispatched version\n\s+if: github.event_name == 'workflow_dispatch'/);
    assert.match(workflow, /run: node scripts\/release-dispatched-version.mjs/);
    assert.match(workflow, /DISPATCH_REF: \$\{\{ github.ref }}/);
    assert.match(workflow, /name: Release\n\s+if: github.event_name != 'workflow_dispatch'/);
    assert.match(workflow, /publish: \$\{\{ steps.dispatch.outputs.should-publish \|\| steps.release.outputs.should-publish }}/);
    assert.match(workflow, /publish-npm-packages:\n\s+if: needs.release.outputs.publish == 'true'\n/);
    assert.doesNotMatch(workflow, /needs.release.outputs.version \|\| github.event.inputs.version/);
});
