// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CommandForm } from './CommandForm';

const meta: Meta<typeof CommandForm> = {
  title: 'CommandForm/CommandForm',
  component: CommandForm,
};

export default meta;
type Story = StoryObj<typeof CommandForm>;
export const Default: Story = {
    args: {

    },
    render: (args) => (
        <div className="storybook-wrapper">
            <CommandForm {...args} />
        </div>
    )
};
