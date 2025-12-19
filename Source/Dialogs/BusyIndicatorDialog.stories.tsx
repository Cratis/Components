import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { BusyIndicatorDialog } from './BusyIndicatorDialog';

const meta: Meta<typeof BusyIndicatorDialog> = {
  title: 'Dialogs/BusyIndicatorDialog',
  component: BusyIndicatorDialog,
};

export default meta;
type Story = StoryObj<typeof BusyIndicatorDialog>;

export const Default: Story = {
  args: {
    title: 'Loading',
    message: 'Please wait while we process your request...'
  },
  render: (args) => (
    <div className="storybook-wrapper">
      <BusyIndicatorDialog {...args} />
    </div>
  )
};
