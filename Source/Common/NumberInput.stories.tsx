// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { NumberInput } from './NumberInput';
import { NumberInputCommitReason } from './NumberInputCommitReason';

const StoryContainer = ({
    children,
}: {
    children: ReactNode;
    size?: string;
    asCard?: boolean;
}) => <div className='cratis:flex cratis:flex-col cratis:gap-4'>{children}</div>;
const StorySection = ({ children }: { children: ReactNode }) => (
    <section>{children}</section>
);

const meta = {
    title: 'Common/NumberInput',
    component: NumberInput,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Controlled locale-aware numeric entry with nullable semantics, explicit commits, stable parts, and provider-owned locale.',
            },
        },
    },
    args: {
        value: 1234.5,
        onChange: fn(),
        onCommit: fn(),
        'aria-label': 'Sample amount',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A controllable representative number input. */
export const Playground: Story = {};

/** Provider and per-control locales format the same semantic number differently. */
export const Locales: Story = {
    render: () => (
        <StoryContainer size='sm' asCard>
            <StorySection>
                <h3>Locale formatting</h3>
                <div className='cratis:flex cratis:flex-col cratis:gap-3 cratis:w-80'>
                    <NumberInput
                        value={1234.5}
                        onChange={fn()}
                        aria-label='American amount'
                        locale='en-US'
                        minimumFractionDigits={2}
                        maximumFractionDigits={2}
                    />
                    <NumberInput
                        value={1234.5}
                        onChange={fn()}
                        aria-label='Norwegian amount'
                        locale='nb-NO'
                        minimumFractionDigits={2}
                        maximumFractionDigits={2}
                    />
                </div>
            </StorySection>
        </StoryContainer>
    ),
};

/** Fixed and ranged fraction policies remain explicit. */
export const FractionPolicies: Story = {
    render: () => (
        <StoryContainer size='sm' asCard>
            <StorySection>
                <h3>Fraction digits</h3>
                <div className='cratis:flex cratis:flex-col cratis:gap-3 cratis:w-80'>
                    <NumberInput
                        value={12.345}
                        onChange={fn()}
                        aria-label='Integer amount'
                        minimumFractionDigits={0}
                        maximumFractionDigits={0}
                    />
                    <NumberInput
                        value={12.345}
                        onChange={fn()}
                        aria-label='One decimal amount'
                        minimumFractionDigits={1}
                        maximumFractionDigits={1}
                    />
                    <NumberInput
                        value={12.345}
                        onChange={fn()}
                        aria-label='Two decimal amount'
                        minimumFractionDigits={2}
                        maximumFractionDigits={2}
                    />
                    <NumberInput
                        value={12.3}
                        onChange={fn()}
                        aria-label='Up to two decimals'
                        minimumFractionDigits={0}
                        maximumFractionDigits={2}
                    />
                </div>
            </StorySection>
        </StoryContainer>
    ),
};

/** Prefixes, suffixes, range boundaries, and visible step controls compose without entering the value text. */
export const AdornmentsAndSteps: Story = {
    render: () => (
        <StoryContainer size='sm' asCard>
            <StorySection>
                <h3>Adornments and steps</h3>
                <div className='cratis:flex cratis:flex-col cratis:gap-3 cratis:w-80'>
                    <NumberInput
                        value={25}
                        onChange={fn()}
                        aria-label='Prefixed amount'
                        prefix='$'
                        min={0}
                        step={5}
                    />
                    <NumberInput
                        value={2.5}
                        onChange={fn()}
                        aria-label='Weight'
                        suffix='kg'
                        min={0}
                        step={0.1}
                        maximumFractionDigits={1}
                    />
                </div>
            </StorySection>
        </StoryContainer>
    ),
};

/** Empty, invalid, read-only, and disabled states use the same semantic surface. */
export const States: Story = {
    render: () => (
        <StoryContainer size='sm' asCard>
            <StorySection>
                <h3>States</h3>
                <div className='cratis:flex cratis:flex-col cratis:gap-3 cratis:w-80'>
                    <NumberInput
                        value={null}
                        onChange={fn()}
                        aria-label='Required quantity'
                        placeholder='Enter a quantity'
                        required
                    />
                    <NumberInput
                        value={150}
                        onChange={fn()}
                        aria-label='Invalid quantity'
                        min={0}
                        max={100}
                        invalid
                        errorMessage='Use a value from zero to one hundred.'
                    />
                    <NumberInput
                        value={24}
                        onChange={fn()}
                        aria-label='Read-only quantity'
                        readOnly
                    />
                    <NumberInput
                        value={24}
                        onChange={fn()}
                        aria-label='Disabled quantity'
                        disabled
                    />
                </div>
            </StorySection>
        </StoryContainer>
    ),
};

/** The control composes with an external label and supporting description. */
export const InContext: Story = {
    render: () => (
        <StoryContainer size='sm' asCard>
            <StorySection>
                <label id='demo-quantity-label' htmlFor='demo-quantity'>
                    Demo quantity
                </label>
                <NumberInput
                    id='demo-quantity'
                    aria-labelledby='demo-quantity-label'
                    name='demoQuantity'
                    value={8}
                    onChange={fn()}
                    min={0}
                    max={20}
                    description='Choose a value from zero to twenty.'
                />
            </StorySection>
        </StoryContainer>
    ),
};

const InteractiveNumberInput = () => {
    const [value, setValue] = useState<number | null>(null);
    const [events, setEvents] = useState<string[]>([]);
    return (
        <div className='cratis:flex cratis:w-80 cratis:flex-col cratis:gap-3'>
            <label id='interactive-number-label' htmlFor='interactive-number'>
                Interactive amount
            </label>
            <NumberInput
                id='interactive-number'
                aria-labelledby='interactive-number-label'
                value={value}
                onChange={(nextValue) => {
                    setValue(nextValue);
                    setEvents((current) => [...current, `change:${nextValue}`]);
                }}
                onCommit={(nextValue, reason) =>
                    setEvents((current) => [...current, `commit:${reason}:${nextValue}`])
                }
                minimumFractionDigits={2}
                maximumFractionDigits={2}
            />
            <output data-testid='semantic-value'>{value ?? 'empty'}</output>
            <ol data-testid='event-order'>
                {events.map((event, index) => (
                    <li key={`${event}-${index}`}>{event}</li>
                ))}
            </ol>
        </div>
    );
};

/** Typing remains local until Enter commits change before commit. */
export const Interactive: Story = {
    render: () => <InteractiveNumberInput />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('textbox', { name: 'Interactive amount' });
        await userEvent.type(input, '1234.50');
        await expect(canvas.getByTestId('semantic-value')).toHaveTextContent('empty');
        await userEvent.type(input, '{Enter}');
        await expect(canvas.getByTestId('semantic-value')).toHaveTextContent('1234.5');
        await expect(canvas.getByTestId('event-order').textContent).toContain(
            `change:1234.5commit:${NumberInputCommitReason.Enter}:1234.5`,
        );
    },
};
