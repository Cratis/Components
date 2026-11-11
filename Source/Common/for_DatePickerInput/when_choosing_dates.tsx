// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { DatePickerInput, type DatePickerInputProps } from '../DatePickerInput';

describe('when choosing dates', () => {
    let container: HTMLDivElement;
    let root: Root;
    const chosen = new Date(2024, 2, 15, 13, 45);

    const mount = async (
        props: Partial<DatePickerInputProps>,
        providerValue?: Parameters<typeof CratisComponentsProvider>[0]['value'],
    ) => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        const element: ReactNode = (
            <CratisComponentsProvider value={providerValue}>
                <DatePickerInput
                    value={null}
                    onChange={() => undefined}
                    aria-label='Appointment date'
                    {...props}
                />
            </CratisComponentsProvider>
        );
        await act(async () => root.render(element));
    };

    const part = (name: string) =>
        document.querySelector<HTMLElement>(`[data-cratis-part="${name}"]`);
    const segment = (type: string) =>
        container.querySelector<HTMLElement>(`[data-cratis-part="segment"][data-type="${type}"]`);
    const openCalendar = async () => {
        await act(async () => part('trigger')!.click());
    };

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should offer no time segments for a date-only picker', async () => {
        await mount({ value: chosen });
        expect(segment('day')).to.not.equal(null);
        expect(segment('hour')).to.equal(null);
        expect(segment('minute')).to.equal(null);
    });

    it('should offer hour and minute segments when showTime is set', async () => {
        await mount({ value: chosen, showTime: true });
        expect(segment('hour')).to.not.equal(null);
        expect(segment('minute')).to.not.equal(null);
    });

    it('should show a day period segment for a 12 hour format', async () => {
        await mount({ value: chosen, showTime: true, hourFormat: '12' });
        expect(segment('dayPeriod')).to.not.equal(null);
    });

    it('should not show a day period segment for a 24 hour format', async () => {
        await mount({ value: chosen, showTime: true, hourFormat: '24' });
        expect(segment('dayPeriod')).to.equal(null);
    });

    it('should mark the root selected only when it has a value', async () => {
        await mount({ value: chosen });
        expect(part('root')?.getAttribute('data-selected')).to.equal('true');
        expect(part('group')?.getAttribute('data-empty')).to.equal(null);
    });

    it('should mark the root and group empty when it has no value', async () => {
        await mount({ value: null });
        expect(part('root')?.getAttribute('data-selected')).to.equal(null);
        expect(part('group')?.getAttribute('data-empty')).to.equal('true');
    });

    it('should omit the calendar trigger when showIcon is false', async () => {
        await mount({ showIcon: false });
        expect(part('trigger')).to.equal(null);
    });

    it('should mark the root open after the calendar opens', async () => {
        await mount({});
        expect(part('root')?.getAttribute('data-open')).to.equal(null);
        await openCalendar();
        expect(part('root')?.getAttribute('data-open')).to.equal('true');
        expect(part('popover')).to.not.equal(null);
    });

    it('should not open the calendar when read only', async () => {
        await mount({ readOnly: true });
        await openCalendar();
        expect(part('popover')).to.equal(null);
        expect(part('root')?.getAttribute('data-readonly')).to.equal('true');
    });

    it('should emit a local date for the chosen calendar cell', async () => {
        const onChange = vi.fn();
        await mount({ value: chosen, onChange });
        await openCalendar();
        const cell = Array.from(
            document.querySelectorAll<HTMLElement>('[data-cratis-part="cell"] , [role="gridcell"] [role="button"]'),
        ).find(candidate => candidate.textContent === '20');
        if (!cell) throw new Error('The calendar did not render day 20.');
        await act(async () => cell.click());
        const emitted = onChange.mock.calls[0][0] as Date;
        expect([emitted.getFullYear(), emitted.getMonth(), emitted.getDate()]).to.deep.equal([2024, 2, 20]);
        expect(onChange.mock.calls[0][1]).to.deep.equal({ source: 'user' });
    });

    it('should emit null with the native event when Clear is clicked', async () => {
        const onChange = vi.fn();
        await mount({ value: chosen, showButtonBar: true, onChange });
        await openCalendar();
        await act(async () => part('clear')!.click());
        expect(onChange.mock.calls.length).to.equal(1);
        expect(onChange.mock.calls[0][0]).to.equal(null);
        expect(onChange.mock.calls[0][1].source).to.equal('user');
        expect(onChange.mock.calls[0][1].nativeEvent).to.be.instanceOf(Event);
    });

    it('should label the actions from props before provider messages', async () => {
        await mount(
            { showButtonBar: true, todayLabel: 'Now' },
            { messages: { datePicker: { today: 'Provider today', clear: 'Provider clear' } } },
        );
        await openCalendar();
        expect(part('today')?.textContent).to.equal('Now');
        expect(part('clear')?.textContent).to.equal('Provider clear');
    });

    it('should label the actions with English defaults without provider messages', async () => {
        await mount({ showButtonBar: true });
        await openCalendar();
        expect(part('today')?.textContent).to.equal('Today');
        expect(part('clear')?.textContent).to.equal('Clear');
    });

    it('should name the calendar controls from provider messages and defaults', async () => {
        await mount({}, { messages: { datePicker: { openCalendar: 'Pick', nextMonth: 'Later' } } });
        await openCalendar();
        expect(part('trigger')?.getAttribute('aria-label')).to.equal('Pick');
        expect(part('next')?.getAttribute('aria-label')).to.equal('Later');
        expect(part('previous')?.getAttribute('aria-label')).to.equal('Previous month');
    });
});
