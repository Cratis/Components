// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const expensiveJobs = Object.freeze([
    'source', 'source-specs', 'adapters', 'tooling', 'typescript-consumers',
    'verify-public-types', 'storybook', 'release-evidence', 'verify-published-exports',
    'verify-package-graph', 'verify-provider-context-identity', 'verify-arc-consumers',
    'verify-package-managers', 'verify-renderer-adapters',
]);
export const maxGitOutput = 32 * 1024 * 1024;
const documentationFiles = new Set([
    '.github/workflows/documentation.yml',
    '.github/workflows/markdown-verification.yml',
    '.markdownlint.json',
]);
// Documentation files that build or spec steps read; a change to them must run full validation.
const buildInputDocumentation = new Set([
    'Documentation/storybook.mdx',
    'Documentation/Migration/3-to-4.md',
]);
const documentationExtensions = ['.md', '.mdx', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];
const shaPattern = /^[a-f0-9]{40}$/;

// Only these internally authored messages may be printed by the CLI.
class GateError extends Error {}

function requireCondition(condition, message) {
    if (!condition) throw new GateError(message);
}

const invalidSegments = new Set(['', '.', '..']);

function validatePath(path) {
    if (/[\\\x00]/.test(path)) throw new GateError('Invalid repository-relative path');
    if (path.split('/').some(part => invalidSegments.has(part))) {
        throw new GateError('Invalid repository-relative path');
    }
}

export function isRelevant(path) {
    validatePath(path);
    if (buildInputDocumentation.has(path)) return true;
    if (documentationFiles.has(path)) return false;
    return !(path.startsWith('Documentation/') &&
        (documentationExtensions.some(extension => path.endsWith(extension)) || path.endsWith('/toc.yml')));
}

export function parsePaths(output) {
    if (!Buffer.isBuffer(output)) throw new GateError('Expected binary Git output');
    if (output.length === 0) return [];
    if (output.at(-1) !== 0) throw new GateError('Incomplete NUL-delimited Git output');
    const paths = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })
        .decode(output.subarray(0, -1)).split('\0');
    paths.forEach(validatePath);
    return paths;
}

export function classifyPaths(paths) {
    // Validate every path, even after a relevant one, before accepting the complete diff.
    const relevance = paths.map(isRelevant);
    return paths.length === 0 || relevance.some(Boolean);
}

export function runGit(args) {
    return spawnSync('git', args, {
        shell: false,
        encoding: 'buffer',
        maxBuffer: maxGitOutput,
        timeout: 30_000,
    });
}

function requireGitSuccess(result) {
    requireCondition(result, 'Missing Git result');
    requireCondition(!result.error, 'Git command could not complete');
    requireCondition(!result.signal, 'Git command was interrupted');
    requireCondition(result.status === 0, 'Git command failed');
}

function gitOutput(runner, args) {
    const result = runner(args);
    requireGitSuccess(result);
    requireCondition(Buffer.isBuffer(result.stdout), 'Expected binary Git output');
    requireCondition(result.stdout.length <= maxGitOutput, 'Git output exceeded its limit');
    return result.stdout;
}

function gitText(runner, args) {
    return new TextDecoder('utf-8', { fatal: true }).decode(gitOutput(runner, args)).trim();
}

function requireObject(value) {
    if (!isObject(value)) throw new GateError('Expected an object');
    return value;
}

function mergeMetadata(event, sha) {
    const pr = requireObject(requireObject(event).pull_request);
    const base = requireObject(pr.base).sha;
    const head = requireObject(pr.head).sha;
    for (const value of [sha, base, head]) {
        requireCondition(typeof value === 'string', 'Missing PR merge SHA');
        requireCondition(shaPattern.test(value), 'Invalid PR merge SHA');
    }
    return { base, head };
}

function verifyMerge(event, sha, runner) {
    const { base, head } = mergeMetadata(event, sha);
    const checkout = gitText(runner, ['rev-parse', '--verify', 'HEAD']);
    requireCondition(checkout === sha, 'Checkout HEAD does not match the workflow merge SHA');
    const parents = gitText(runner, ['show', '-s', '--format=%P', 'HEAD']).split(' ');
    requireCondition(parents.length === 2, 'Expected a two-parent PR test merge');
    requireCondition(parents[0] === base, 'PR merge base parent does not match');
    requireCondition(parents[1] === head, 'PR merge head parent does not match');
}

export function detectChanges(eventName, event, sha, runner = runGit) {
    if (eventName === 'push' || eventName === 'workflow_dispatch') return true;
    if (eventName !== 'pull_request') throw new GateError('Unsupported workflow event');
    verifyMerge(event, sha, runner);
    const output = gitOutput(runner, [
        'diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--name-only', '-z', 'HEAD^1', 'HEAD', '--',
    ]);
    return classifyPaths(parsePaths(output));
}

function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireKeys(object, keys) {
    requireObject(object);
    if (Object.keys(object).length !== keys.length) throw new GateError('Unexpected dependency key count');
    if (!keys.every(key => Object.hasOwn(object, key))) {
        throw new GateError('Incomplete or unexpected dependency keys');
    }
}

function detectorOutput(detector) {
    requireObject(detector);
    if (detector.result !== 'success') {
        throw new GateError('changes did not succeed');
    }
    requireKeys(detector.outputs, ['relevant']);
    const relevant = detector.outputs.relevant;
    if (relevant !== 'true' && relevant !== 'false') {
        throw new GateError('changes has an invalid relevant output');
    }
    return relevant;
}

export function aggregate(needs) {
    requireKeys(needs, ['changes', ...expensiveJobs]);
    const relevant = detectorOutput(needs.changes);
    const expected = relevant === 'true' ? 'success' : 'skipped';
    for (const job of expensiveJobs) {
        if (!isObject(needs[job]) || needs[job].result !== expected) {
            throw new GateError(`${job} must have result ${expected}`);
        }
    }
    return `Verified ${expensiveJobs.length} jobs: ${relevant === 'true' ? 'relevant validation complete' : 'intentional documentation-only skip'}`;
}

export function runCommand(mode, env, io = { readFileSync, appendFileSync, log: console.log }, runner = runGit) {
    if (mode === 'aggregate') {
        io.log(aggregate(JSON.parse(env.NEEDS_JSON)));
        return;
    }
    if (mode !== 'detect') throw new GateError('Expected detect or aggregate mode');
    const event = env.GITHUB_EVENT_NAME === 'pull_request'
        ? JSON.parse(io.readFileSync(env.GITHUB_EVENT_PATH, 'utf8')) : undefined;
    const relevant = detectChanges(env.GITHUB_EVENT_NAME, event, env.GITHUB_SHA, runner);
    if (!env.GITHUB_OUTPUT) throw new GateError('Missing GITHUB_OUTPUT');
    io.appendFileSync(env.GITHUB_OUTPUT, `relevant=${relevant}\n`);
    io.log(`Validated change detection: relevant=${relevant}`);
}

export function main(args = process.argv.slice(2), env = process.env, io, runner) {
    try {
        if (args.length !== 1) throw new GateError('Expected one mode argument');
        runCommand(args[0], env, io, runner);
        return 0;
    } catch (error) {
        // Never echo event data, filenames, JSON, or Git stderr as workflow commands.
        console.error(error instanceof GateError ? error.message : 'JavaScript Build gate could not validate its input.');
        return args[0] === 'aggregate' ? 1 : 2;
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main();
}
