import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CommandDialog } from './CommandDialog';

const meta: Meta<typeof CommandDialog> = {
  title: 'CommandDialog/CommandDialog',
  component: CommandDialog,
};

export default meta;
type Story = StoryObj<typeof CommandDialog>;

export const Default: Story = {
    args: {

    },
    render: (args) => (
        <div className="storybook-wrapper">
            <CommandDialog {...args} />
        </div>
    )
}
