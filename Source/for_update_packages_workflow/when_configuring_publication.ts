// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, it } from 'vitest';

describe('when configuring dependency update publication', () => {
    let workflow: string;
    let updateJob: string;

    beforeEach(() => {
        workflow = readFileSync(new URL('../../.github/workflows/update-packages.yml', import.meta.url), 'utf8');
        updateJob = workflow.substring(workflow.indexOf('\n  update:'));
    });

    it('should keep scheduled updates paused and allow only manual dispatch', () => {
        const triggers = workflow.split(/^on:\s*\n/m)[1].split(/^\S/m)[0].trim();

        triggers.should.equal('workflow_dispatch:');
    });

    it('should have only the preflight and shared update jobs', () => {
        const jobs = workflow.substring(workflow.indexOf('\njobs:'));
        const jobNames = Array.from(jobs.matchAll(/^ {2}([\w-]+):/gm), match => match[1]);

        jobNames.should.deep.equal(['preflight', 'update']);
        updateJob.should.match(/^ {4}uses: Cratis\/Workflows\/\.github\/workflows\/update-packages\.yml@main$/m);
        updateJob.should.not.match(/^\s+(?:steps|run|post-update-command):/m);
    });

    it('should explicitly select pull request publication with no dispatch override', () => {
        const publicationModes = Array.from(updateJob.matchAll(/^ {6}publication-mode: (.+)$/gm), match => match[1]);

        updateJob.should.match(/^ {4}with:\s*\n {6}publication-mode:/m);
        publicationModes.should.deep.equal(['pull-request']);
    });

    it('should depend on successful configuration preflight without bypass conditions', () => {
        updateJob.should.match(/^ {4}needs: preflight$/m);
        updateJob.should.not.match(/^ {4}if:/m);
        workflow.should.not.match(/^\s+continue-on-error:/m);
        workflow.should.match(/^ {10}APP_ID: \$\{\{ vars.CRATIS_AUTOMATION_APP_ID }}$/m);
        workflow.should.match(/^ {10}APP_PRIVATE_KEY: \$\{\{ secrets.AUTOMATION_APP_PRIVATE_KEY }}$/m);
    });

    it('should keep the built in token read only and disable it entirely in preflight', () => {
        workflow.should.match(/^permissions:\s*\n {2}contents: read$/m);
        workflow.should.match(/^ {4}permissions: \{\}$/m);
        workflow.should.not.match(/^\s+[\w-]+: write(?:\s|$)/m);
        updateJob.should.not.match(/^\s+permissions:/m);
    });

    it('should pass only the automation App key with no personal or publication credentials', () => {
        const secrets = updateJob.split(/^ {4}secrets:\s*\n/m)[1].trim();

        secrets.should.equal('AUTOMATION_APP_PRIVATE_KEY: ${{ secrets.AUTOMATION_APP_PRIVATE_KEY }}');
        workflow.should.not.match(/PAT_WORKFLOWS|secrets\.(?:PAT|NPM|NUGET|PUBLISH)[\w]*/);
    });

    it('should preserve the shared TypeScript hold and repository PrimeReact exclusion', () => {
        const exclusions = readFileSync(new URL('../../.github/update-packages-npm-exclusions', import.meta.url), 'utf8');

        exclusions.trim().split(/\r?\n/).should.include('primereact');
        updateJob.should.not.match(/^\s+npm-package-exclusions:/m);
    });

    it('should leave release intent and merging to review rather than configure them automatically', () => {
        updateJob.should.not.match(/^\s+(?:pull-request-label|auto-merge|automerge|merge):/m);
        updateJob.should.not.match(/\bgh pr merge\b|\bgit push\b/);
    });
});

describe('when checking dependency update App configuration', () => {
    let script: string;

    beforeEach(() => {
        const workflow = readFileSync(new URL('../../.github/workflows/update-packages.yml', import.meta.url), 'utf8');
        const runBlock = workflow.match(/^ {8}run: \|\n((?: {10}.*\n)+)/m)?.[1] ?? '';
        script = runBlock.replace(/^ {10}/gm, '');
        script.should.not.equal('');
    });

    it.each([
        ['', ''],
        ['', 'synthetic-workflow-contract-key'],
        ['12345', '']
    ])('should reject incomplete App configuration (%s, %s) before updates can run', (appId, privateKey) => {
        const result = spawnSync('/bin/bash', ['-euo', 'pipefail', '-c', script], {
            encoding: 'utf8',
            env: { APP_ID: appId, APP_PRIVATE_KEY: privateKey, PATH: '' }
        });

        result.status!.should.equal(1);
        result.stdout.should.include('::error::Dependency updates require CRATIS_AUTOMATION_APP_ID and AUTOMATION_APP_PRIVATE_KEY; fallback credentials are not allowed.');
        result.stderr.should.equal('');
    });

    it('should allow the update job only when both App values are configured', () => {
        const result = spawnSync('/bin/bash', ['-euo', 'pipefail', '-c', script], {
            encoding: 'utf8',
            env: { APP_ID: '12345', APP_PRIVATE_KEY: 'synthetic-workflow-contract-key', PATH: '' }
        });

        result.status!.should.equal(0);
        result.stdout.should.equal('');
        result.stderr.should.equal('');
    });
});
