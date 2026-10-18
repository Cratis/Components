// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { describe, expect, it } from 'vitest';
import {
    DEFAULT_REGISTRY_WAIT_SECONDS,
    installWaitingForRegistry,
    registryWaitTimeoutMs,
    RegistryPropagationTimeout,
    unpublishedExactVersion,
} from '../lib/registry-propagation.mjs';

const notTargetFor = (spec: string) =>
    new Error(
        'npm install of the packed tarball failed:\n' +
            'npm error code ETARGET\n' +
            `npm error notarget No matching version found for ${spec}.\n` +
            'npm error notarget In most cases you or one of your dependencies are requesting\n' +
            "npm error notarget a package version that doesn't exist.",
    );

/** A fake clock and registry: the version appears once `publishedAfterPolls` polls have been made. */
const scenario = (publishedAfterPolls: number, timeoutMs: number, installErrors: Error[]) => {
    let clock = 0;
    let polls = 0;
    let installs = 0;
    const sleeps: number[] = [];
    const result = installWaitingForRegistry(
        () => {
            installs++;
            const error = installErrors.shift();
            if (error) throw error;
            return 'installed';
        },
        {
            isPublished: () => ++polls > publishedAfterPolls,
            sleep: async (milliseconds: number) => {
                sleeps.push(milliseconds);
                clock += milliseconds;
            },
            now: () => clock,
            timeoutMs,
            intervalMs: 30_000,
            log: () => {},
        },
    );
    return { result, polls: () => polls, installs: () => installs, sleeps };
};

describe('when installing while a pinned dependency propagates', () => {
    it('should retry the install once the registry serves the version', async () => {
        const run = scenario(3, 1_200_000, [notTargetFor('@cratis/arc@22.125.1')]);
        (await run.result).should.equal('installed');
        run.installs().should.equal(2);
        run.polls().should.equal(4);
        run.sleeps.should.deep.equal([30_000, 30_000, 30_000]);
    });

    it('should fail naming the package and version when the registry never serves it', async () => {
        const run = scenario(Number.POSITIVE_INFINITY, 70_000, [notTargetFor('@cratis/arc@22.125.1')]);
        const error = (await run.result.catch((caught: unknown) => caught)) as Error;
        error.should.be.instanceOf(RegistryPropagationTimeout);
        error.message.should.contain('@cratis/arc@22.125.1');
        run.installs().should.equal(1);
        run.sleeps.should.deep.equal([30_000, 30_000, 10_000]);
    });

    it('should fail immediately without polling on any other install error', async () => {
        const failure = new Error('npm install of the packed tarball failed:\nnpm error code E403\nnpm error 403 Forbidden');
        const run = scenario(0, 1_200_000, [failure]);
        await run.result.should.be.rejectedWith(failure);
        run.polls().should.equal(0);
        run.installs().should.equal(1);
    });

    it('should wait an interval before asking again when the install still misses a reported version', async () => {
        const run = scenario(0, 1_200_000, [notTargetFor('@cratis/arc@22.125.1'), notTargetFor('@cratis/arc@22.125.1')]);
        (await run.result).should.equal('installed');
        run.installs().should.equal(3);
        run.sleeps.should.deep.equal([30_000]);
    });
});

describe('when reading the failed version from an install error', () => {
    it('should find a scoped package at an exact version', () => {
        expect(unpublishedExactVersion(notTargetFor('@cratis/arc@22.125.1').message)).toEqual({
            name: '@cratis/arc',
            version: '22.125.1',
        });
    });

    it('should find an unscoped package at a prerelease version', () => {
        expect(unpublishedExactVersion(notTargetFor('motion-dom@13.0.0-beta.1').message)).toEqual({
            name: 'motion-dom',
            version: '13.0.0-beta.1',
        });
    });

    it('should ignore a version range, which waiting cannot satisfy', () => {
        expect(unpublishedExactVersion(notTargetFor('motion-dom@^99.0.0').message)).toBeUndefined();
    });

    it('should ignore an error that is not ETARGET', () => {
        expect(unpublishedExactVersion('npm error code E404\nnpm error 404 Not Found')).toBeUndefined();
    });
});

describe('when configuring the registry wait', () => {
    it('should default to twenty minutes', () => {
        registryWaitTimeoutMs({}).should.equal(DEFAULT_REGISTRY_WAIT_SECONDS * 1000);
        DEFAULT_REGISTRY_WAIT_SECONDS.should.equal(1200);
    });

    it('should read seconds from the environment', () => {
        registryWaitTimeoutMs({ CRATIS_REGISTRY_WAIT_SECONDS: '5' }).should.equal(5000);
    });

    it('should reject a value that is not a number of seconds', () => {
        expect(() => registryWaitTimeoutMs({ CRATIS_REGISTRY_WAIT_SECONDS: 'soon' })).toThrow(/CRATIS_REGISTRY_WAIT_SECONDS/);
    });
});
