// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import 'chai/register-should.js';
import { describe, it } from 'vitest';
import { createSlotProfiles } from '../src/internal/slotProfiles.js';

const changeCases = [
    { slotId: 'common.textInput', value: 'after', expected: 'after' },
    { slotId: 'common.textArea', value: 'after', expected: 'after' },
    { slotId: 'common.numberInput', value: undefined, expected: undefined },
    { slotId: 'common.checkbox', value: true, expected: true },
    { slotId: 'common.radio', value: true, expected: true },
    { slotId: 'common.switch', value: true, expected: true },
    { slotId: 'dropdown.select', value: 'editor', expected: 'editor' },
    { slotId: 'display.datePicker', value: new Date('2026-01-02T00:00:00.000Z'), expected: '2026-01-02T00:00:00.000Z' },
    { slotId: 'display.datePicker', value: null, expected: undefined },
] as const;

const callbackFor = (props: Readonly<Record<string, unknown>>, name: string) => {
    const callback = props[name];
    if (typeof callback !== 'function') throw new Error(`Missing ${name} callback.`);
    return callback;
};

describe('when recording slot callback evidence', () => {
    for (const { slotId, value, expected } of changeCases) {
        it(`should preserve the value and native metadata for ${slotId} with ${String(value)}`, () => {
            const evidence = new Map<string, Readonly<Record<string, unknown>>>();
            const profile = createSlotProfiles(evidence).find((candidate) => candidate.slotId === slotId);
            if (!profile) throw new Error(`Missing ${slotId} profile.`);
            const onChange = callbackFor(profile.createProps(), 'onChange');
            const meta = { source: 'user', nativeEvent: new Event('change') };

            onChange(value, meta);
            onChange(value, meta);

            (evidence.get(slotId)! as object).should.deep.equal({
                callbacks: 2,
                value: expected,
                source: 'user',
                nativeEvent: true,
            });
            callbackFor(profile.createProps(), 'onChange')(value);
            (evidence.get(slotId)! as object).should.deep.equal({
                callbacks: 1,
                value: expected,
                source: undefined,
                nativeEvent: false,
            });
        });
    }

    for (const [slotId, name, value, detail] of [
        ['common.button', 'onClick', undefined, {}],
        ['common.iconButton', 'onClick', undefined, {}],
        ['dialogs.dialog', 'onClose', undefined, {}],
        ['datatables.paginator', 'onPageChange', 2, { page: 2 }],
    ] as const) {
        it(`should count each ${slotId} fixture independently`, () => {
            const evidence = new Map<string, Readonly<Record<string, unknown>>>();
            const profile = createSlotProfiles(evidence).find((candidate) => candidate.slotId === slotId);
            if (!profile) throw new Error(`Missing ${slotId} profile.`);
            const callback = callbackFor(profile.createProps(), name);

            callback(value);
            callback(value);
            (evidence.get(slotId)! as object).should.deep.equal({ callbacks: 2, ...detail });
            callbackFor(profile.createProps(), name)(value);
            (evidence.get(slotId)! as object).should.deep.equal({ callbacks: 1, ...detail });
        });
    }
});
