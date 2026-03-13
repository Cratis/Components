// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Page } from './Page';

const meta: Meta<typeof Page> = {
    title: 'Common/Page',
    component: Page,
};

export default meta;
type Story = StoryObj<typeof Page>;

export const Default: Story = {
    args: {
        title: 'My Page Title',
    },
    render: (args) => (
        <Page {...args}>
            <div className="p-4">
                <p>This is the page content area.</p>
                <p>The Page component provides a consistent layout with a title and content area.</p>
            </div>
        </Page>
    )
};

export const WithPanel: Story = {
    args: {
        title: 'Page with Panel',
        panel: true,
    },
    render: (args) => (
        <Page {...args}>
            <div className="p-4">
                <p>This page has the panel style applied.</p>
                <p>The panel prop adds special styling to the content area.</p>
            </div>
        </Page>
    )
};

export const WithTitle: Story = {
    args: {
        title: 'Visible Page Title',
        showTitle: true,
    },
    render: (args) => (
        <Page {...args}>
            <div className="p-4">
                <p>The title is shown above because showTitle is true.</p>
            </div>
        </Page>
    )
};

export const WithoutTitle: Story = {
    args: {
        title: 'Hidden Page Title',
        showTitle: false,
    },
    render: (args) => (
        <Page {...args}>
            <div className="p-4">
                <p>The title is hidden because showTitle is false (the default).</p>
            </div>
        </Page>
    )
};
