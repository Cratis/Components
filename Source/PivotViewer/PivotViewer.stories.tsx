import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { PivotViewer } from './PivotViewer';

const meta: Meta<typeof PivotViewer> = {
    title: 'PivotViewer/PivotViewer',
    component: PivotViewer,
};

export default meta;
type Story = StoryObj<typeof PivotViewer>;

export const Default: Story = {
    args: {
    },
    render: (args) => (
        <div className="storybook-wrapper" >
            <PivotViewer {...args} />
        </div>
    )
}