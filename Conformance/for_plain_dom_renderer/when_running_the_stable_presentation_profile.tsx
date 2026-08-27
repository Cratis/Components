// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { beforeAll, describe, it } from 'vitest';
import { runConformance, type ConformanceReport } from '../src/index.js';
import { validateMetadata } from '../src/internal/metadata.js';
import plainDomPresentationMetadata from './given/plainDomPresentationMetadata.json';
import { plainDomPresentationRenderer } from './given/plainDomPresentationRenderer.js';

const stablePresentationSlots = [
    'common.button',
    'common.iconButton',
    'common.textInput',
    'common.textArea',
    'common.checkbox',
    'common.radio',
    'common.switch',
    'common.progress',
    'common.surface',
] as const;

describe('when running the private plain DOM stable presentation profile', () => {
    let report: ConformanceReport;

    beforeAll(async () => {
        report = await runConformance(plainDomPresentationRenderer, {
            metadata: plainDomPresentationMetadata,
            document,
        });
    }, 30_000);

    it('should pass all one hundred bounded checks with zero skips', () => {
        const failures = report.checks
            .filter((check) => check.status === 'failed')
            .map(
                (check) =>
                    `${check.id}: ${check.message} ${JSON.stringify(check.evidence ?? {})}`,
            );

        expect(failures).to.deep.equal([]);
        expect(report.passed).to.equal(true);
        expect(report.summary).to.deep.equal({
            total: 100,
            passed: 100,
            failed: 0,
            skipped: 0,
        });
        expect(plainDomPresentationRenderer.profileSlots).to.deep.equal(
            stablePresentationSlots,
        );
    });

    it('should use schema valid static metadata consistent with the runtime manifest', () => {
        expect(validateMetadata(plainDomPresentationMetadata)).to.deep.equal([]);
        expect(
            report.checks.find((check) => check.id === 'manifest.schema')?.status,
        ).to.equal('passed');
        expect(
            report.checks.find((check) => check.id === 'manifest.runtimeConsistency')
                ?.status,
        ).to.equal('passed');
    });

    it('should expose exact native elements and refs for every ref capable slot', () => {
        const refCapableSlots = stablePresentationSlots.filter(
            (slotId) => slotId !== 'common.progress',
        );
        const checks = refCapableSlots.map((slotId) =>
            report.checks.find((check) => check.id === `contract.${slotId}.elementRef`),
        );

        expect(checks.every((check) => check?.status === 'passed')).to.equal(true);
        expect(checks.every((check) => check?.evidence?.refMatches === true)).to.equal(
            true,
        );
    });

    it('should preserve native form reset and user change metadata', () => {
        const evidenceFor = (slotId: (typeof stablePresentationSlots)[number]) =>
            report.checks.find((check) => check.id === `behavior.${slotId}`)?.evidence;
        const button = evidenceFor('common.button');
        const textInput = evidenceFor('common.textInput');
        const textArea = evidenceFor('common.textArea');
        const checkbox = evidenceFor('common.checkbox');
        const radio = evidenceFor('common.radio');
        const switchControl = evidenceFor('common.switch');

        expect(button?.submitEvents).to.equal(1);
        expect(textInput).to.include({
            callbacks: 1,
            source: 'user',
            nativeEvent: true,
            resetValue: 'before',
            resetMatches: true,
        });
        expect(textArea).to.include({
            callbacks: 1,
            source: 'user',
            nativeEvent: true,
            resetValue: 'before',
            resetMatches: true,
        });
        for (const evidence of [checkbox, radio, switchControl]) {
            expect(evidence).to.include({
                callbacks: 1,
                source: 'user',
                nativeEvent: true,
                resetChecked: false,
                resetMatches: true,
            });
        }
    });
});
