// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { DatePickerInput } from '../DatePickerInput';

/**
 * The custom Today action used to call `onChange` with today's date unconditionally,
 * bypassing `minDate`/`maxDate` entirely — unlike every calendar-cell selection, which
 * React Aria's `minValue`/`maxValue` already constrain. These specs pin Today to the same
 * bounds contract: disabled and inert once today falls outside the configured range.
 */
describe('when bounding the Today action by minDate/maxDate', () => {
    let container: HTMLDivElement;
    let root: Root;

    const startOfDay = (date: Date) =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const addDays = (date: Date, days: number) => {
        const next = new Date(date);
        next.setDate(next.getDate() + days);
        return next;
    };
    const today = startOfDay(new Date());
    const yesterday = addDays(today, -1);
    const tomorrow = addDays(today, 1);

    const mount = async (options: {
        minDate?: Date;
        maxDate?: Date;
        onChange: (value: Date | null) => void;
    }) => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <DatePickerInput
                        value={null}
                        onChange={options.onChange}
                        aria-label='Appointment date'
                        showButtonBar
                        minDate={options.minDate}
                        maxDate={options.maxDate}
                    />
                </CratisComponentsProvider>,
            );
        });

        const trigger = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="trigger"]',
        );
        if (!trigger) throw new Error('DatePickerInput did not render its trigger.');
        await act(async () => trigger.click());

        const todayButton = document.querySelector<HTMLButtonElement>(
            '[data-cratis-part="today"]',
        );
        if (!todayButton)
            throw new Error('DatePickerInput did not render the Today action.');
        return todayButton;
    };

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should disable the Today action when today is before minDate', async () => {
        const onChange = vi.fn();
        const todayButton = await mount({ minDate: tomorrow, onChange });
        expect(todayButton.disabled).to.equal(true);
        expect(todayButton.getAttribute('aria-disabled')).to.equal('true');
    });

    it('should disable the Today action when today is after maxDate', async () => {
        const onChange = vi.fn();
        const todayButton = await mount({ maxDate: yesterday, onChange });
        expect(todayButton.disabled).to.equal(true);
        expect(todayButton.getAttribute('aria-disabled')).to.equal('true');
    });

    it('should not invoke onChange when a disabled Today action is clicked', async () => {
        const onChange = vi.fn();
        const todayButton = await mount({ minDate: tomorrow, onChange });
        await act(async () => todayButton.click());
        expect(onChange.mock.calls).to.deep.equal([]);
    });

    it('should keep the Today action enabled when today is within bounds', async () => {
        const onChange = vi.fn();
        const todayButton = await mount({
            minDate: yesterday,
            maxDate: tomorrow,
            onChange,
        });
        expect(todayButton.disabled).to.equal(false);
        expect(todayButton.getAttribute('aria-disabled')).to.equal(null);
    });

    it("should emit today's date when the Today action is within bounds", async () => {
        const onChange = vi.fn();
        const todayButton = await mount({
            minDate: yesterday,
            maxDate: tomorrow,
            onChange,
        });
        await act(async () => todayButton.click());
        expect(onChange.mock.calls.length).to.equal(1);
        const emitted = onChange.mock.calls[0][0] as Date;
        expect(startOfDay(emitted).getTime()).to.equal(today.getTime());
    });

    it('should keep the Today action enabled with no minDate/maxDate configured', async () => {
        const onChange = vi.fn();
        const todayButton = await mount({ onChange });
        expect(todayButton.disabled).to.equal(false);
    });
});
