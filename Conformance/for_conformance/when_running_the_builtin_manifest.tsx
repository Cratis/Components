// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import sourcePackage from '../../Source/package.json';
import adapterSchema from '../../Source/schemas/ui-adapter.schema.json';
import { unstable_cratisBuiltIn } from '@cratis/components/renderer/builtin';
import { describe, it } from 'vitest';
import { runConformance } from '../src/index.js';
import { validateMetadata } from '../src/internal/metadata.js';

describe('when running the built-in renderer manifest', () => {
    it('should pass every bounded check with zero skips', async () => {
        const report = await runConformance(unstable_cratisBuiltIn, {
            metadata: sourcePackage.cratis,
            document,
        });
        const failures = report.checks
            .filter((check) => check.status === 'failed')
            .map(
                (check) =>
                    `${check.id}: ${check.message} ${JSON.stringify(check.evidence ?? {})}`,
            );

        expect(failures).to.deep.equal([]);
        expect(report.passed).to.equal(true);
        expect(report.summary.total).to.equal(148);
        expect(report.summary.passed).to.equal(148);
        expect(report.summary.skipped).to.equal(0);
        expect(Object.keys(unstable_cratisBuiltIn.slots)).to.have.lengthOf(14);
    }, 30_000);

    it('should validate the actual static fixture against the published schema identity', () => {
        expect(adapterSchema.$id).to.equal(
            'https://cratis.io/schemas/ui-adapter.schema.json',
        );
        expect(adapterSchema.required).to.include.members([
            'slots',
            'modes',
            'capabilities',
            'ssr',
            'a11y',
        ]);
        expect(sourcePackage.cratis.slots).to.have.lengthOf(14);
        expect(validateMetadata(sourcePackage.cratis)).to.deep.equal([]);
    });

    it('should reject metadata that violates nested public schema constraints', () => {
        const invalidFixtures = [
            { ...sourcePackage.cratis, displayName: '' },
            { ...sourcePackage.cratis, export: 'not-an-export' },
            { ...sourcePackage.cratis, ssr: 'unknown' },
            {
                ...sourcePackage.cratis,
                a11y: { ...sourcePackage.cratis.a11y, undocumented: true },
            },
        ];

        for (const fixture of invalidFixtures) {
            expect(validateMetadata(fixture)).not.to.deep.equal([]);
        }
    });
});
