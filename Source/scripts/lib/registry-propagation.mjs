// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Waits for npm to serve a just-published dependency before giving up on a fresh install.
 *
 * A release can pin a dependency version that was published minutes earlier. Until the registry
 * serves it, `npm install` fails with ETARGET ("No matching version found"). That is not a defect in
 * the package, so for an exact version the install is retried once the registry reports the version.
 * Every other install failure is rethrown immediately.
 */

import { spawnSync } from 'node:child_process';

export const REGISTRY_WAIT_SECONDS_VARIABLE = 'CRATIS_REGISTRY_WAIT_SECONDS';
export const DEFAULT_REGISTRY_WAIT_SECONDS = 1200;
export const DEFAULT_POLL_INTERVAL_MS = 30_000;

const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const NO_MATCHING_VERSION = /No matching version found for ((?:@[^\s/@]+\/)?[^\s@]+)@(\S+)/;

/** Raised when an exact dependency version is still not served by the registry when the wait ends. */
export class RegistryPropagationTimeout extends Error {
    constructor(name, version, waitedSeconds, lastError) {
        super(
            `${name}@${version} was still not served by the npm registry after waiting ${waitedSeconds} s; ` +
                `the fresh-dependency check could not install the packed tarball.\nLast install error:\n${lastError}`,
        );
        this.name = 'RegistryPropagationTimeout';
        this.packageName = name;
        this.version = version;
    }
}

/**
 * Returns the package and exact version an install failed to find (npm ETARGET/notarget), or
 * undefined when the failure is anything else, including a missing version range.
 */
export function unpublishedExactVersion(message) {
    if (!/\bETARGET\b|\bnotarget\b/.test(message)) return undefined;
    const match = NO_MATCHING_VERSION.exec(message);
    if (!match) return undefined;
    const version = match[2].replace(/[.,;:]+$/, '');
    return EXACT_VERSION.test(version) ? { name: match[1], version } : undefined;
}

/** Reads the registry wait from the environment, in milliseconds. */
export function registryWaitTimeoutMs(env = process.env) {
    const configured = env[REGISTRY_WAIT_SECONDS_VARIABLE];
    if (configured === undefined || configured === '') return DEFAULT_REGISTRY_WAIT_SECONDS * 1000;
    const seconds = Number(configured);
    if (!Number.isFinite(seconds) || seconds < 0) {
        throw new Error(`${REGISTRY_WAIT_SECONDS_VARIABLE} must be a non-negative number of seconds, but was '${configured}'.`);
    }
    return seconds * 1000;
}

/** Asks the registry whether it serves `name@version`. */
export function isPublishedOnRegistry(name, version, cwd) {
    const result = spawnSync('npm', ['view', `${name}@${version}`, 'version'], { cwd, encoding: 'utf8', timeout: 60_000 });
    return result.status === 0 && result.stdout.trim().split(/\s+/).includes(version);
}

const sleepFor = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Runs `install`, and when it fails because an exact dependency version is not yet served, polls the
 * registry until it is and runs `install` again, for at most `timeoutMs` in total.
 */
export async function installWaitingForRegistry(install, options = {}) {
    const {
        isPublished = isPublishedOnRegistry,
        sleep = sleepFor,
        now = Date.now,
        timeoutMs = registryWaitTimeoutMs(),
        intervalMs = DEFAULT_POLL_INTERVAL_MS,
        log = (message) => console.log(message),
    } = options;
    const deadline = now() + timeoutMs;
    const reportedPublished = new Set();

    for (;;) {
        let missing;
        try {
            return install();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            missing = unpublishedExactVersion(message);
            if (!missing) throw error;
            missing.lastError = message;
        }

        const { name, version, lastError } = missing;
        const waitOrGiveUp = async () => {
            const remaining = deadline - now();
            if (remaining <= 0) throw new RegistryPropagationTimeout(name, version, Math.round(timeoutMs / 1000), lastError);
            await sleep(Math.min(intervalMs, remaining));
        };

        log(`${name}@${version} is not served by the npm registry yet; waiting for it to propagate.`);
        // The registry already reported this version once and the install still missed it, so give
        // the mirrors an interval before asking again instead of retrying in a tight loop.
        if (reportedPublished.has(`${name}@${version}`)) await waitOrGiveUp();
        while (!isPublished(name, version)) await waitOrGiveUp();
        reportedPublished.add(`${name}@${version}`);
        log(`${name}@${version} is now served by the npm registry; retrying the install.`);
    }
}
