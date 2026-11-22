// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { DatePickerInput } from '../../Common/DatePickerInput';
import { an_editor } from './given/an_editor';

vi.mock('../../Common/DatePickerInput', () => ({ DatePickerInput: vi.fn(() => null) }));

const schema = {
    properties: {
        date: { type: 'string', format: 'date' },
        instant: { type: 'string', format: 'date-time' },
    },
};
const object = { date: '2026-01-02', instant: '2026-01-02T03:04:05.000Z' };
const selectedDate = new Date('2026-02-03T04:05:06.000Z');

const picker = (name: string) => {
    const call = vi.mocked(DatePickerInput).mock.calls.find(([props]) => props['aria-label'] === name);
    if (!call) throw new Error(`Date picker '${name}' was not rendered.`);
    return call[0];
};

describe('when editing ObjectContentEditor dates', () => {
    let editor: an_editor;
    const onChange = vi.fn();

    beforeEach(async () => {
        editor = new an_editor();
        onChange.mockClear();
        vi.mocked(DatePickerInput).mockClear();
        await editor.render({ object, schema, editMode: true, onChange });
    });
    afterEach(async () => editor.dispose());

    it('should pass date values and time settings to the existing picker', () => {
        picker('date').value!.getTime().should.equal(new Date(object.date).getTime());
        picker('instant').value!.getTime().should.equal(new Date(object.instant).getTime());
        (picker('date').showTime === undefined).should.equal(true);
        picker('instant').showTime!.should.equal(true);
        picker('date').showIcon!.should.equal(true);
    });

    it('should serialize a date without a time and default missing metadata to user', async () => {
        await act(async () => picker('date').onChange(selectedDate));
        onChange.mock.calls.should.deep.equal([[{ ...object, date: '2026-02-03' }, { source: 'user' }]]);
    });

    it('should serialize a date-time as an ISO instant and preserve metadata', async () => {
        const metadata = { source: 'programmatic' as const };
        await act(async () => picker('instant').onChange(selectedDate, metadata));
        onChange.mock.calls.should.deep.equal([[{ ...object, instant: selectedDate.toISOString() }, metadata]]);
        onChange.mock.calls[0][1].should.equal(metadata);
    });

    it('should emit null when either picker is cleared', async () => {
        await act(async () => picker('date').onChange(null));
        await act(async () => picker('instant').onChange(null));
        (onChange.mock.calls[0][0].date === null).should.equal(true);
        (onChange.mock.calls[1][0].instant === null).should.equal(true);
        editor.container.querySelectorAll('small').length.should.equal(2);
    });
});
