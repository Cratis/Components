// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Command, CommandValidator } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { StoryContainer, StorySection } from '@cratis/arc.react/stories';
import '@cratis/arc/validation';
import { AutoCommandForm } from './AutoCommandForm';

const meta: Meta = {
    title: 'CommandForm/Auto Command Form',
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj;

class RegisterProjectCommand extends Command {
    readonly route: string = '/api/register-project';
    readonly validation: CommandValidator<RegisterProjectCommand> = new (class extends CommandValidator<RegisterProjectCommand> { })();
    readonly propertyDescriptors: PropertyDescriptor[] = [
        new PropertyDescriptor('projectId', String),
        new PropertyDescriptor('name', String),
        new PropertyDescriptor('budget', Number),
        new PropertyDescriptor('isBillable', Boolean),
        new PropertyDescriptor('startDate', Date),
    ];

    projectId = '';
    name = '';
    budget = 0;
    isBillable = false;
    startDate = new Date();

    get requestParameters(): string[] {
        return [];
    }

    constructor() {
        super(Object, false);
    }
}

export const Default: Story = {
    render: () => (
        <StoryContainer>
            <StorySection>
                <h3>Fields generated from RegisterProjectCommand's own properties</h3>
                <AutoCommandForm command={RegisterProjectCommand} exclude={['projectId']} />
            </StorySection>
        </StoryContainer>
    ),
};
