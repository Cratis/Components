// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { DatePickerInput } from './DatePickerInput';

const meta = {
    title: 'Common/DatePickerInput',
    component: DatePickerInput,
    args: { value: null, onChange: fn() },
    parameters: {
        layout: 'padded',
        a11y: { config: { rules: [{ id: 'target-size', enabled: true }] } },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof DatePickerInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const ControlledPicker = ({
    initialValue = null,
    disabled = false,
    invalid = false,
}: {
    initialValue?: Date | null;
    disabled?: boolean;
    invalid?: boolean;
}) => {
    const [value, setValue] = useState<Date | null>(initialValue);
    return (
        <DatePickerInput
            aria-label='Delivery date'
            value={value}
            onChange={setValue}
            placeholder='Choose a date'
            showButtonBar
            disabled={disabled}
            invalid={invalid}
            style={{ width: '18rem' }}
        />
    );
};

export const StateMatrix: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: '1rem', maxWidth: '20rem' }}>
            <ControlledPicker />
            <ControlledPicker initialValue={new Date(2024, 5, 15)} />
            <ControlledPicker initialValue={new Date(2024, 5, 15)} disabled />
            <ControlledPicker invalid />
        </div>
    ),
};

export const SegmentHitTargets: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: '1rem', maxWidth: '20rem' }}>
            <ControlledPicker />
            <ControlledPicker initialValue={new Date(2024, 5, 15)} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const segments = canvas.getAllByRole('spinbutton');
        const undersized = segments
            .map((segment) => segment.getBoundingClientRect())
            .filter((rect) => rect.width < 24 || rect.height < 24);
        await expect(
            undersized,
            `undersized segments: ${JSON.stringify(
                segments.map((segment) => {
                    const rect = segment.getBoundingClientRect();
                    return {
                        type: segment.getAttribute('data-type'),
                        width: rect.width,
                        height: rect.height,
                    };
                }),
            )}`,
        ).toHaveLength(0);
    },
};

const ControlledTimePicker = ({ width }: { width: string }) => {
    const [value, setValue] = useState<Date | null>(new Date(2024, 5, 15, 9, 30));
    return (
        <DatePickerInput
            aria-label='Delivery date and time'
            value={value}
            onChange={setValue}
            placeholder='Choose a date and time'
            showTime
            hourFormat='12'
            style={{ width }}
        />
    );
};

// Every editable segment has to stay inside the input box it belongs to: overflowing it would
// either be clipped by the group or painted underneath the calendar trigger.
const segmentsOutsideTheirInput = (canvasElement: HTMLElement) =>
    Array.from(canvasElement.querySelectorAll<HTMLElement>('.cratis-date-picker__input')).flatMap(
        (input) => {
            const inputRect = input.getBoundingClientRect();
            return Array.from(
                input.querySelectorAll<HTMLElement>(
                    "[data-cratis-part='segment']:not([data-type='literal'])",
                ),
            )
                .map((segment) => ({ segment, rect: segment.getBoundingClientRect() }))
                .filter(
                    ({ rect }) =>
                        rect.left < inputRect.left - 0.5 ||
                        rect.right > inputRect.right + 0.5 ||
                        rect.top < inputRect.top - 0.5 ||
                        rect.bottom > inputRect.bottom + 0.5 ||
                        rect.width < 24 ||
                        rect.height < 24,
                )
                .map(({ segment, rect }) => ({
                    inputWidth: inputRect.width,
                    type: segment.getAttribute('data-type'),
                    left: rect.left,
                    right: rect.right,
                    width: rect.width,
                    height: rect.height,
                }));
        },
    );

export const NarrowShowTime12Hour: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: '1rem', justifyItems: 'start' }}>
            <ControlledTimePicker width='18rem' />
            {/* A phone-sized content column: 375px viewport minus the usual 16px gutters. */}
            <div style={{ width: '343px' }}>
                <ControlledTimePicker width='100%' />
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const atRest = segmentsOutsideTheirInput(canvasElement);
        await expect(atRest, JSON.stringify(atRest)).toHaveLength(0);

        const hour = canvasElement.querySelector<HTMLElement>("[data-type='hour']");
        if (!hour) throw new Error('Hour segment not found.');
        hour.focus();
        await userEvent.keyboard('{ArrowUp}');
        await expect(hour).toHaveTextContent('10');

        const afterEditing = segmentsOutsideTheirInput(canvasElement);
        await expect(afterEditing, JSON.stringify(afterEditing)).toHaveLength(0);
    },
};

export const OpenCalendar: Story = {
    render: () => <ControlledPicker initialValue={new Date(2024, 5, 15)} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /open calendar/i }));
        await expect(within(document.body).getByRole('dialog')).toBeTruthy();
    },
};
