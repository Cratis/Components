// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { TagGroup } from './TagGroup';

const meta = {
    title: 'Common/TagGroup',
    component: TagGroup,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A group of removable values with an optional text entry — the control behind a tag or ' +
                    'chips field. Every tag is reachable with the arrow keys and removable with Backspace or ' +
                    'Delete. In the entry, Enter and each configured separator commit the typed value, ' +
                    'Backspace on an empty entry removes the last tag, and a pasted list is split on the ' +
                    'separators.',
            },
        },
    },
} satisfies Meta<typeof TagGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled = ({
    initial = ['React', 'TypeScript'],
    ...rest
}: { initial?: string[] } & Partial<React.ComponentProps<typeof TagGroup>>) => {
    const [value, setValue] = useState(initial);
    return (
        <TagGroup
            value={value}
            onChange={setValue}
            aria-label='Skills'
            placeholder='Add a skill…'
            removeLabel={(entry) => `Remove ${entry}`}
            {...rest}
        />
    );
};

/** Type a value and press Enter or comma. */
export const Default: Story = {
    args: { value: [], onChange: () => undefined },
    render: () => <Controlled />,
};

/** Without the entry, the group is a read-only set of removable tags. */
export const NotEditable: Story = {
    args: { value: [], onChange: () => undefined },
    render: () => <Controlled editable={false} />,
};

/** Disabled: no entry, no remove actions. */
export const Disabled: Story = {
    args: { value: [], onChange: () => undefined },
    render: () => <Controlled disabled />,
};

/** Marked invalid and described by a field's error text. */
export const Invalid: Story = {
    args: { value: [], onChange: () => undefined },
    render: () => (
        <div className='cratis:flex cratis:flex-col cratis:gap-1'>
            <label htmlFor='skills'>Skills</label>
            <Controlled
                id='skills'
                invalid
                aria-label={undefined}
                aria-describedby='skills-error'
            />
            <span id='skills-error'>Add at least three skills.</span>
        </div>
    ),
};

/** The remove glyph is a slot, so a product keeps its own close icon. */
export const CustomRemoveIcon: Story = {
    args: { value: [], onChange: () => undefined },
    render: () => (
        <Controlled
            removeIcon={
                <svg
                    aria-hidden='true'
                    width='8'
                    height='8'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                >
                    <path d='M18 6 6 18M6 6l12 12' />
                </svg>
            }
        />
    ),
};

/** Adding with Enter and removing the last with Backspace. */
export const AddsAndRemoves: Story = {
    args: { value: [], onChange: () => undefined },
    render: () => <Controlled initial={['React']} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('textbox');

        await userEvent.type(input, 'MobX{Enter}');
        await expect(canvas.getByText('MobX')).toBeTruthy();

        await userEvent.type(input, '{Backspace}');
        await expect(canvas.queryByText('MobX')).toBeNull();
    },
};
