// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
    aggregate, classifyPaths, detectChanges, expensiveJobs, isRelevant, main,
    maxGitOutput, parsePaths, runCommand,
} from './javascript-build-gate.mjs';

const docs = [
    'Documentation/Canvas/index.md', 'Documentation/Canvas/example.mdx',
    'Documentation/Canvas/toc.yml',
    ...['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].map(ext => `Documentation/image.${ext}`),
    '.github/workflows/documentation.yml', '.github/workflows/markdown-verification.yml', '.markdownlint.json',
];
const relevant = [
    'Source/example.md', 'Storybook/example.mdx', 'Adapters/example.ts', 'scripts/example.mjs',
    'package.json', 'yarn.lock', '.yarnrc.yml', '.yarn/releases/yarn-4.17.1.cjs',
    'README.md', 'release.md', 'rollup.config.mjs', '.cratis/ai.json',
    '.github/workflows/javascript-build.yml', '.github/workflows/publish.yml',
    '.github/workflows/new.yml', 'NewRoot/example.md', 'Documentation/verify-markdown.sh',
    'Documentation/unknown.xyz', 'Documentation/toc.yaml', 'Documentation/image.PNG',
    'Documentation/storybook.mdx', 'Documentation/Migration/3-to-4.md',
];
const merge = 'a'.repeat(40);
const base = 'b'.repeat(40);
const head = 'c'.repeat(40);
const event = { pull_request: { base: { sha: base }, head: { sha: head } } };
const nul = paths => Buffer.from(paths.length ? `${paths.join('\0')}\0` : '');
const successful = stdout => ({ status: 0, signal: null, stdout });

function gitFixture(diff = nul(docs), overrides = {}) {
    const calls = [];
    const runner = args => {
        calls.push(args);
        const result = {
            'rev-parse': successful(Buffer.from(`${merge}\n`)),
            show: successful(Buffer.from(`${base} ${head}\n`)),
            diff: successful(diff),
            ...overrides,
        }[args[0]];
        if (result instanceof Error) throw result;
        return result;
    };
    return { runner, calls };
}

function needsFixture(mode) {
    return {
        changes: { result: 'success', outputs: { relevant: mode } },
        ...Object.fromEntries(expensiveJobs.map(job => [job, {
            result: mode === 'true' ? 'success' : 'skipped', outputs: {},
        }])),
    };
}

function ioFixture() {
    const writes = [];
    const logs = [];
    return {
        writes, logs,
        readFileSync: () => JSON.stringify(event),
        appendFileSync: (...args) => writes.push(args),
        log: message => logs.push(message),
    };
}

for (const path of docs) {
    test(`exempts only documented documentation path: ${path}`, () => assert.equal(isRelevant(path), false));
}
for (const path of relevant) {
    test(`requires full validation for: ${path}`, () => assert.equal(isRelevant(path), true));
}

test('mixed, duplicate, and permuted paths require validation; empty diff is conservative', () => {
    assert.equal(classifyPaths([]), true);
    assert.equal(classifyPaths(docs), false);
    for (const paths of [[...docs, ...relevant], [...relevant, ...docs], [...docs, ...docs, relevant[0]]]) {
        assert.equal(classifyPaths(paths), true);
    }
});

test('deletions and both endpoints of renames participate in classification', () => {
    for (const [paths, expected] of [
        [['Source/deleted.ts'], true], [['Documentation/deleted.md'], false],
        [['Source/old.ts', 'Documentation/new.md'], true],
        [['Documentation/old.md', 'Source/new.ts'], true],
        [['Documentation/old.md', 'Documentation/new.md'], false],
    ]) {
        assert.equal(detectChanges('pull_request', event, merge, gitFixture(nul(paths)).runner), expected);
    }
});

test('binary NUL framing preserves hostile valid filenames without shell interpretation', () => {
    const paths = ['space name', 'tab\tname', 'line\nname', '"quoted"', '`command`', '$(command)', '-flag', '例子']
        .map(name => `Documentation/${name}.md`);
    assert.deepEqual(parsePaths(nul(paths)), paths);
    assert.equal(classifyPaths(parsePaths(nul(paths))), false);
    assert.equal(classifyPaths(['--leading-option']), true);
});

test('documentation extensions must end the filename, not precede a trailing newline', () => {
    for (const suffix of ['\n', '\r', '\r\n', '.unknown']) {
        assert.equal(isRelevant(`Documentation/example.md${suffix}`), true);
    }
});

test('malformed framing, invalid UTF-8 and suspicious path structures fail closed', () => {
    for (const output of [Buffer.from('Documentation/file.md'), Buffer.from('\0'),
        Buffer.from('Documentation/a.md\0\0'), Buffer.from([0xff, 0]), 'not binary']) {
        assert.throws(() => parsePaths(output));
    }
    for (const path of ['/Documentation/a.md', '../Documentation/a.md', 'Documentation/../a.md',
        'Documentation//a.md', 'Documentation/./a.md', 'Documentation/\\a.md', '', 'Documentation/a\0.md']) {
        assert.throws(() => classifyPaths(['Source/a.ts', path]));
    }
    assert.equal(isRelevant('\ufeffDocumentation/a.md'), true);
    assert.deepEqual(parsePaths(Buffer.alloc(0)), []);
});

test('PR detection verifies HEAD and both parents before a complete no-renames NUL diff', () => {
    const { runner, calls } = gitFixture();
    assert.equal(detectChanges('pull_request', event, merge, runner), false);
    assert.deepEqual(calls, [
        ['rev-parse', '--verify', 'HEAD'], ['show', '-s', '--format=%P', 'HEAD'],
        ['diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--name-only', '-z', 'HEAD^1', 'HEAD', '--'],
    ]);
});

test('push and manual runs require all jobs without consulting PR history', () => {
    for (const name of ['push', 'workflow_dispatch']) {
        assert.equal(detectChanges(name, undefined, undefined, () => assert.fail('Git must not run')), true);
    }
    assert.throws(() => detectChanges('pull_request_target', event, merge));
});

test('missing metadata, mismatched checkout and absent or incorrect merge parents reject detection', () => {
    for (const metadata of [undefined, {}, { pull_request: {} },
        { pull_request: { base: { sha: base }, head: { sha: 'invalid' } } }]) {
        assert.throws(() => detectChanges('pull_request', metadata, merge, gitFixture().runner));
    }
    assert.throws(() => detectChanges('pull_request', event, undefined, gitFixture().runner));
    for (const overrides of [
        { 'rev-parse': successful(Buffer.from(head)) },
        ...['', base, `${head} ${base}`, `${base} ${head} ${merge}`, `${merge} ${head}`]
            .map(parents => ({ show: successful(Buffer.from(parents)) })),
    ]) {
        assert.throws(() => detectChanges('pull_request', event, merge, gitFixture(undefined, overrides).runner));
    }
});

test('Git exit, spawn, signal, timeout, overflow and partial-output failures never become documentation-only', () => {
    const failures = [
        undefined, new Error('synthetic spawn failure'),
        { status: 1, stdout: nul(docs) }, { status: null, signal: 'SIGTERM', stdout: nul(docs) },
        { status: 0, error: { code: 'ETIMEDOUT' }, stdout: nul(docs) },
        { status: 0, error: { code: 'ENOBUFS' }, stdout: nul(docs) },
        successful(Buffer.alloc(maxGitOutput + 1)), successful('not binary'),
    ];
    for (const command of ['rev-parse', 'show', 'diff']) {
        for (const result of failures) {
            assert.throws(() => detectChanges('pull_request', event, merge, gitFixture(undefined, { [command]: result }).runner));
        }
    }
    assert.throws(() => detectChanges('pull_request', event, merge, gitFixture(Buffer.from('Documentation/a.md')).runner));
});

for (const mode of ['true', 'false']) {
    test(`aggregate accepts only the complete intentional ${mode} truth-table row`, () => {
        assert.match(aggregate(needsFixture(mode)), /^Verified 10 jobs:/);
    });
    for (const job of expensiveJobs) {
        test(`aggregate ${mode} rejects every inconsistent or missing result for ${job}`, () => {
            for (const result of ['success', 'skipped', 'failure', 'cancelled', undefined, null, '', 'unknown', true, 0]) {
                if (result === (mode === 'true' ? 'success' : 'skipped')) continue;
                const needs = needsFixture(mode);
                needs[job].result = result;
                assert.throws(() => aggregate(needs), new RegExp(job));
            }
            for (const invalid of [null, [], {}, 'success']) {
                const needs = needsFixture(mode);
                needs[job] = invalid;
                assert.throws(() => aggregate(needs));
            }
            const needs = needsFixture(mode);
            delete needs[job];
            assert.throws(() => aggregate(needs));
        });
    }
    test(`aggregate ${mode} rejects unsuccessful or absent detectors`, () => {
        for (const result of ['failure', 'cancelled', 'skipped', undefined, null, 'unknown']) {
            const needs = needsFixture(mode);
            needs.changes.result = result;
            assert.throws(() => aggregate(needs));
        }
        for (const changes of [null, [], {}, undefined]) {
            const needs = needsFixture(mode);
            needs.changes = changes;
            assert.throws(() => aggregate(needs));
        }
    });
}

test('aggregate rejects invalid object shapes, missing/extra keys and non-string boolean outputs', () => {
    for (const needs of [null, [], {}, true, 'text', { ...needsFixture('true'), extra: { result: 'success' } }]) {
        assert.throws(() => aggregate(needs));
    }
    for (const value of [undefined, null, true, false, 1, 0, '', 'TRUE', ' false', 'unknown']) {
        const needs = needsFixture('true');
        needs.changes.outputs.relevant = value;
        assert.throws(() => aggregate(needs));
    }
    for (const outputs of [undefined, null, [], {}, { relevant: 'false', extra: 'false' }]) {
        const needs = needsFixture('false');
        needs.changes.outputs = outputs;
        assert.throws(() => aggregate(needs));
    }
});

test('CLI writes an exact boolean only after successful detection and never prints filenames', () => {
    const io = ioFixture();
    runCommand('detect', {
        GITHUB_EVENT_NAME: 'pull_request', GITHUB_EVENT_PATH: 'event.json', GITHUB_SHA: merge, GITHUB_OUTPUT: 'output',
    }, io, gitFixture().runner);
    assert.deepEqual(io.writes, [['output', 'relevant=false\n']]);
    assert.deepEqual(io.logs, ['Validated change detection: relevant=false']);
    const pushIo = ioFixture();
    runCommand('detect', { GITHUB_EVENT_NAME: 'push', GITHUB_OUTPUT: 'output' }, pushIo);
    assert.deepEqual(pushIo.writes, [['output', 'relevant=true\n']]);
});

test('CLI exit codes distinguish rejection from detection/operational failure without writing false', t => {
    const errors = [];
    t.mock.method(console, 'error', message => errors.push(message));
    const io = ioFixture();
    assert.equal(main(['aggregate'], { NEEDS_JSON: JSON.stringify(needsFixture('false')) }, io), 0);
    for (const json of [undefined, '', '{', 'null', '[]', '{}', JSON.stringify(needsFixture(true))]) {
        assert.equal(main(['aggregate'], { NEEDS_JSON: json }, io), 1);
    }
    assert.equal(main(['detect'], { GITHUB_EVENT_NAME: 'pull_request' }, io), 2);
    assert.equal(main(['detect'], { GITHUB_EVENT_NAME: 'push' }, io), 2);
    assert.equal(main(['unknown'], {}, io), 2);
    assert.equal(main([], {}, io), 2);
    const prEnv = { GITHUB_EVENT_NAME: 'pull_request', GITHUB_SHA: merge, GITHUB_OUTPUT: 'output' };
    assert.equal(main(['detect'], prEnv, io, gitFixture(undefined, { diff: { status: 1 } }).runner), 2);
    assert.equal(main(['detect'], prEnv, { ...io, readFileSync: () => '{::untrusted::' }), 2);
    assert.equal(main(['detect'], { GITHUB_EVENT_NAME: 'push', GITHUB_OUTPUT: 'output' }, {
        ...io, appendFileSync: () => { throw new Error('::untrusted::'); },
    }), 2);
    const missingDetector = needsFixture('true');
    delete missingDetector.changes;
    assert.equal(main(['aggregate'], { NEEDS_JSON: JSON.stringify(missingDetector) }, io), 1);
    assert.deepEqual(io.writes, []);
    assert.ok(errors.length > 0);
    assert.ok(errors.every(message => !message.includes('::untrusted::')));
});

const workflow = readFileSync(new URL('../.github/workflows/javascript-build.yml', import.meta.url), 'utf8');
const jobs = Object.fromEntries([...workflow.matchAll(/^    ([A-Za-z_][A-Za-z0-9_-]*):\n([\s\S]*?)(?=^    [A-Za-z_][A-Za-z0-9_-]*:|$(?![\s\S]))/gm)]
    .filter(match => workflow.indexOf(match[0]) > workflow.indexOf('\njobs:\n'))
    .map(([, id, block]) => [id, block.replace(/^    #.*\n/gm, '')]));

test('workflow has unfiltered ordinary PRs and preserves the original push filter', () => {
    assert.match(workflow, /    pull_request:\n        branches:\n            - '\*\*'\n\npermissions:/);
    assert.doesNotMatch(workflow, /pull_request_target|merge_group|secrets\.|self-hosted/);
    assert.match(workflow, /concurrency:\n    group: \$\{\{ github.event_name == 'pull_request' && format\('\{0\}-\{1\}', github.workflow, github.ref\) \|\| format\('\{0\}-\{1\}', github.workflow, github.run_id\) \}\}\n    cancel-in-progress: \$\{\{ github.event_name == 'pull_request' \}\}/);
    assert.equal(workflow.match(/    push:\n[\s\S]*?(?=    pull_request:)/)?.[0], `    push:
        branches:
            - 'main'
        paths:
            - 'Source/**'
            - 'Migrator/**'
            - 'ESLint/**'
            - 'Conformance/**'
            - 'Adapters/**'
            - 'Storybook/**'
            - 'scripts/**'
            - 'compat-manifest.json'
            - 'README.md'
            - 'release.md'
            - 'run-task-on-workspaces.js'
            - 'package.json'
            - 'rollup.config.mjs'
            - 'yarn.lock'
            - '.yarnrc.yml'
            - '.yarn/releases/yarn-4.17.1.cjs'
            - '.github/workflows/javascript-build.yml'
            - '.github/workflows/publish.yml'
`);
});

test('every one of the 10 expensive job groups is guarded and directly required by Build', () => {
    assert.equal(expensiveJobs.length, 10);
    assert.deepEqual(Object.keys(jobs).sort(), ['changes', 'build', ...expensiveJobs].sort());
    for (const job of expensiveJobs) {
        assert.match(jobs[job], /^        needs: \[changes\]$/m);
        assert.match(jobs[job], /^        if: needs.changes.outputs.relevant == 'true'$/m);
    }
    const needs = jobs.build.match(/        needs:\n((?:            - [a-z-]+\n)+)/)?.[1];
    assert.ok(needs);
    assert.deepEqual(needs.trim().split('\n').map(line => line.trim().slice(2)).sort(), ['changes', ...expensiveJobs].sort());
    assert.match(jobs.build, /^        name: Build$/m);
    assert.match(jobs.build, /^        if: always\(\)$/m);
    assert.doesNotMatch(jobs.build, /strategy:/);
});

test('published-artifact runs every packed-artifact check from one build per leg', () => {
    const block = jobs['published-artifact'];
    assert.ok(block);
    assert.equal(block.split('yarn run prepare').length - 1, 1);
    const ordered = [
        'yarn verify-packed-production',
        'node scripts/verify-exports.mjs',
        'scripts/verify-package-graph.mjs --report',
        'scripts/verify-provider-context-identity.mjs',
        'scripts/verify-public-types.mjs --report',
        'yarn test-release-evidence',
        'yarn generate-release-evidence',
    ];
    const positions = ordered.map(text => {
        assert.ok(block.includes(text), text);
        return block.indexOf(text);
    });
    const lastVerify = Math.max(...positions.slice(0, 5));
    assert.ok(positions[5] > lastVerify && positions[6] > lastVerify, 'release evidence runs after every verify- command');
    for (const text of [
        'CRATIS_TYPESCRIPT_VERSION: ${{ matrix.typescript }}',
        'name: components-v4-release-evidence-${{ github.sha }}',
        'name: verify-public-types-report-ts${{ matrix.typescript }}',
        'name: verify-package-graph-report',
        "typescript: ['6', '7']",
    ]) {
        assert.ok(block.includes(text), text);
    }
    assert.match(block, /^        permissions:\n            contents: read$/m);
    assert.doesNotMatch(block, /continue-on-error/);
});

test('the Yarn package cache is restore-only with exactly one saver', () => {
    const restore = 'uses: actions/cache/restore@55cc8345863c7cc4c66a329aec7e433d2d1c52a9';
    const key = "key: ${{ runner.os }}-yarn-cache-v3-${{ hashFiles('yarn.lock', '.yarnrc.yml', '.yarn/releases/yarn-4.17.1.cjs') }}";
    for (const job of expensiveJobs) {
        assert.ok(jobs[job].includes(restore), `${job} restores`);
        assert.match(jobs[job], /^                  path: \.yarn\/cache$/m, job);
        assert.ok(jobs[job].includes(key), `${job} key`);
        assert.match(jobs[job], /restore-keys: \|\n\s+\$\{\{ runner\.os \}\}-yarn-cache-v3-\n/, job);
    }
    assert.doesNotMatch(workflow, /\*\*\/node_modules|eslintcache/);
    assert.equal(workflow.split('actions/cache/save@').length - 1, 1);
    assert.ok(jobs.tooling.includes('uses: actions/cache/save@55cc8345863c7cc4c66a329aec7e433d2d1c52a9'));
    assert.ok(jobs.tooling.includes('key: ${{ steps.yarn-cache.outputs.cache-primary-key }}'));
    assert.ok(jobs.tooling.includes("if: steps.yarn-cache.outputs.cache-hit != 'true'"));
    assert.equal(workflow.split('uses: actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9').length - 1, 1);
    assert.ok(jobs.storybook.includes('uses: actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9'));
});

test('cheap jobs use pinned read-only hosted checkout and Node without install, secrets, or credentials', () => {
    for (const job of ['changes', 'build']) {
        const block = jobs[job];
        assert.match(block, /^        runs-on: ubuntu-latest$/m);
        assert.match(block, /^        timeout-minutes: 5$/m);
        assert.match(block, /^        permissions:\n            contents: read$/m);
        assert.match(block, /uses: actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/);
        assert.match(block, /persist-credentials: false/);
        assert.match(block, /uses: actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020/);
        assert.match(block, /node-version: 24.x/);
        assert.doesNotMatch(block, /yarn|cache@|playwright|secrets\.|GITHUB_TOKEN|github\.token|NODE_AUTH_TOKEN/);
    }
    assert.match(jobs.changes, /fetch-depth: 2/);
    assert.match(jobs.changes, /relevant: \$\{\{ steps.detect.outputs.relevant \}\}/);
    assert.match(jobs.changes, /run: node --test scripts\/javascript-build-gate.test.mjs/);
    assert.match(jobs.changes, /id: detect\n              run: node scripts\/javascript-build-gate.mjs detect/);
    assert.match(jobs.build, /env:\n                  NEEDS_JSON: \$\{\{ toJSON\(needs\) \}\}/);
    assert.match(jobs.build, /run: node scripts\/javascript-build-gate.mjs aggregate/);
});
