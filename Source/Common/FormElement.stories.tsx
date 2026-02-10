// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { FormElement } from './FormElement';
import { InputText } from 'primereact/inputtext';

const meta: Meta<typeof FormElement> = {
    title: 'Common/FormElement',
    component: FormElement,
};

export default meta;
type Story = StoryObj<typeof FormElement>;

export const Default: Story = {
    args: {
        icon: <i className="pi pi-user" />,
    },
    render: (args) => (
        <div className="p-4">
            <FormElement {...args}>
                <InputText placeholder="Username" />
            </FormElement>
        </div>
    )
};

export const WithEmailIcon: Story = {
    args: {
        icon: <i className="pi pi-envelope" />,
    },
    render: (args) => (
        <div className="p-4">
            <FormElement {...args}>
                <InputText type="email" placeholder="Email address" />
            </FormElement>
        </div>
    )
};

export const WithSearchIcon: Story = {
    args: {
        icon: <i className="pi pi-search" />,
    },
    render: (args) => (
        <div className="p-4">
            <FormElement {...args}>
                <InputText placeholder="Search..." />
            </FormElement>
        </div>
    )
};
