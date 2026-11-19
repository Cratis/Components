// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Command, CommandValidator } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { CommandForm } from '@cratis/arc.react/commands';
import { StoryContainer, StorySection } from '@cratis/arc.react/stories';
import '@cratis/arc/validation';
import { CommandDialog } from '../CommandDialog/CommandDialog';
import { AutoCommandFields } from './AutoCommandFields';
import { InputTextField } from './fields';

const meta: Meta = {
    title: 'CommandForm/Auto Command Fields',
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj;

class RenameProjectCommand extends Command {
    readonly route: string = '/api/rename-project';
    readonly validation: CommandValidator<RenameProjectCommand> = new (class extends CommandValidator<RenameProjectCommand> { })();
    readonly propertyDescriptors: PropertyDescriptor[] = [
        new PropertyDescriptor('projectId', String),
        new PropertyDescriptor('name', String),
        new PropertyDescriptor('budget', Number),
        new PropertyDescriptor('isBillable', Boolean),
    ];

    projectId = '';
    name = '';
    budget = 0;
    isBillable = false;

    get requestParameters(): string[] {
        return [];
    }

    constructor() {
        super(Object, false);
    }
}

export const InACommandForm: Story = {
    render: () => (
        <StoryContainer>
            <StorySection>
                <h3>Generated fields next to a handwritten one</h3>
                <CommandForm command={RenameProjectCommand}>
                    <InputTextField<RenameProjectCommand> value={c => c.projectId} title='Project Id' />
                    <AutoCommandFields<RenameProjectCommand> exclude={['projectId']} />
                </CommandForm>
            </StorySection>
        </StoryContainer>
    ),
};

export const InACommandDialog: Story = {
    render: () => (
        <StoryContainer>
            <StorySection>
                <CommandDialog command={RenameProjectCommand} title='Rename project'>
                    <AutoCommandFields<RenameProjectCommand> exclude={['projectId']} />
                </CommandDialog>
            </StorySection>
        </StoryContainer>
    ),
};
