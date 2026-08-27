// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sourcePackage from '../../Source/package.json';
import adapterSchema from '../../Source/schemas/ui-adapter.schema.json';
import { unstable_cratisBuiltIn } from '@cratis/components/renderer/builtin';
import { describe, it } from 'vitest';
import { runConformance } from '../src/index.js';

describe('when running the built-in renderer manifest', () => {
    it('should pass every bounded check with zero skips', async () => {
        const report = await runConformance(unstable_cratisBuiltIn, {
            metadata: sourcePackage.cratis,
            document,
        });
        const failures = report.checks
            .filter((check) => check.status === 'failed')
            .map((check) => `${check.id}: ${check.message}`);

        failures.should.deep.equal([]);
        report.passed.should.equal(true);
        report.summary.total.should.equal(134);
        report.summary.passed.should.equal(134);
        report.summary.skipped.should.equal(0);
        Object.keys(unstable_cratisBuiltIn.slots).should.have.lengthOf(14);
    }, 30_000);

    it('should validate the actual static fixture against the published schema identity', () => {
        adapterSchema.$id.should.equal('https://cratis.io/schemas/ui-adapter.schema.json');
        adapterSchema.required.should.include.members([
            'slots',
            'modes',
            'capabilities',
            'ssr',
            'a11y',
        ]);
        sourcePackage.cratis.slots.should.have.lengthOf(14);
    });
});
