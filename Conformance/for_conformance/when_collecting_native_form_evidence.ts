// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import 'chai/register-should.js';
import { unstable_cratisBuiltIn } from '@cratis/components/renderer/builtin';
import { beforeAll, describe, it } from 'vitest';
import { runConformance, type ConformanceReport } from '../src/index.js';

const textCases = [
    { slotId: 'common.textInput', name: 'sample' },
    { slotId: 'common.textArea', name: 'notes' },
] as const;

const choiceCases = [
    { slotId: 'common.checkbox', name: 'selected', value: 'on' },
    { slotId: 'common.radio', name: 'frequency', value: 'daily' },
    { slotId: 'common.switch', name: 'enabled', value: 'on' },
] as const;

describe('when collecting native form evidence', () => {
    let report: ConformanceReport;
    beforeAll(async () => {
        report = await runConformance(unstable_cratisBuiltIn, { document, axe: false });
    });

    for (const { slotId, name } of textCases) {
        it(`should capture the submitted and reset text values for ${slotId}`, () => {
            const evidence = report.checks.find((check) => check.id === `behavior.${slotId}`)!.evidence!;
            (evidence as object).should.include({
                name,
                nativeValue: 'after',
                resetValue: 'before',
                resetMatches: true,
                callbacks: 1,
            });
            (evidence.formData as object).should.deep.equal({
                [name]: 'after',
            });
        });
    }

    for (const { slotId, name, value } of choiceCases) {
        it(`should capture the checked form value and unchecked reset for ${slotId}`, () => {
            const evidence = report.checks.find((check) => check.id === `behavior.${slotId}`)!.evidence!;
            (evidence as object).should.include({ name, nativeValue: value, resetChecked: false, resetMatches: true, callbacks: 1 });
            (evidence.formData as object).should.deep.equal({ [name]: value });
        });
    }
});
