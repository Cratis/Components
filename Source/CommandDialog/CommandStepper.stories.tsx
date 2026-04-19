// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StepperPanel } from 'primereact/stepperpanel';
import { CommandStepper } from './CommandStepper';
import { Command, CommandResult, CommandValidator } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { InputTextField, NumberField, TextAreaField } from '../CommandForm/fields';
import '@cratis/arc/validation';

const meta: Meta<typeof CommandStepper> = {
    title: 'CommandDialog/CommandStepper',
    component: CommandStepper,
};

export default meta;
type Story = StoryObj<typeof CommandStepper>;

class CreateProjectValidator extends CommandValidator {
    constructor() {
        super();
        this.ruleFor((c: CreateProjectCommand) => c.name).notEmpty().minLength(2).maxLength(100);
        this.ruleFor((c: CreateProjectCommand) => c.email).notEmpty().emailAddress();
        this.ruleFor((c: CreateProjectCommand) => c.description).notEmpty().minLength(10);
        this.ruleFor((c: CreateProjectCommand) => c.budget).greaterThan(0);
    }
}

class CreateProjectCommand extends Command<object> {
    readonly route: string = '/api/projects/create';
    readonly validation: CommandValidator = new CreateProjectValidator();
    readonly propertyDescriptors: PropertyDescriptor[] = [
        new PropertyDescriptor('name', String),
        new PropertyDescriptor('email', String),
        new PropertyDescriptor('description', String),
        new PropertyDescriptor('budget', Number),
    ];

    name = '';
    email = '';
    description = '';
    budget = 0;

    constructor() {
        super(Object, false);
    }

    get requestParameters(): string[] {
        return [];
    }

    get properties(): string[] {
        return ['name', 'email', 'description', 'budget'];
    }

    override async validate(): Promise<CommandResult<object>> {
        const errors = this.validation?.validate(this) ?? [];
        if (errors.length > 0) {
            return CommandResult.validationFailed(errors);
        }
        return CommandResult.empty;
    }

    override async execute(): Promise<CommandResult<object>> {
        const validation = await this.validate();
        if (!validation.isSuccess) {
            return validation;
        }
        return CommandResult.empty;
    }
}

export const Default: Story = {
    render: () => {
        const [result, setResult] = useState('');

        return (
            <div style={{ width: '600px', padding: '1.5rem' }}>
                <CommandStepper<CreateProjectCommand>
                    command={CreateProjectCommand}
                    autoServerValidate={false}
                    validateOn="change"
                    onSuccess={async () => setResult('Command submitted successfully')}
                >
                    <StepperPanel header="Basic Info">
                        <InputTextField<CreateProjectCommand>
                            value={c => c.name}
                            title="Project Name"
                            placeholder="Enter project name (min 2 chars)"
                        />
                        <InputTextField<CreateProjectCommand>
                            value={c => c.email}
                            title="Contact Email"
                            placeholder="Enter contact email"
                            type="email"
                        />
                    </StepperPanel>
                    <StepperPanel header="Details">
                        <TextAreaField<CreateProjectCommand>
                            value={c => c.description}
                            title="Description"
                            placeholder="Describe the project (min 10 chars)"
                            rows={4}
                        />
                        <NumberField<CreateProjectCommand>
                            value={c => c.budget}
                            title="Budget"
                            placeholder="Enter budget (must be > 0)"
                        />
                    </StepperPanel>
                </CommandStepper>

                {result && (
                    <div className="p-2 mt-3 border-round surface-100" style={{ border: '1px solid var(--surface-border)' }}>
                        {result}
                    </div>
                )}
            </div>
        );
    },
};

export const WithValidationIndicators: Story = {
    render: () => {
        const [result, setResult] = useState('');

        return (
            <div style={{ width: '600px', padding: '1.5rem' }}>
                <CommandStepper<CreateProjectCommand>
                    command={CreateProjectCommand}
                    autoServerValidate={false}
                    validateOn="change"
                    validateOnInit
                    nextLabel="Continue"
                    previousLabel="Back"
                    okLabel="Create"
                    onSuccess={async () => setResult('Project created successfully')}
                >
                    <StepperPanel header="Basic Info">
                        <InputTextField<CreateProjectCommand>
                            value={c => c.name}
                            title="Project Name"
                            placeholder="Enter project name (min 2 chars)"
                        />
                        <InputTextField<CreateProjectCommand>
                            value={c => c.email}
                            title="Contact Email"
                            placeholder="Enter contact email"
                            type="email"
                        />
                    </StepperPanel>
                    <StepperPanel header="Details">
                        <TextAreaField<CreateProjectCommand>
                            value={c => c.description}
                            title="Description"
                            placeholder="Describe the project (min 10 chars)"
                            rows={4}
                        />
                        <NumberField<CreateProjectCommand>
                            value={c => c.budget}
                            title="Budget"
                            placeholder="Enter budget (must be > 0)"
                        />
                    </StepperPanel>
                </CommandStepper>

                {result && (
                    <div className="p-2 mt-3 border-round surface-100" style={{ border: '1px solid var(--surface-border)' }}>
                        {result}
                    </div>
                )}
            </div>
        );
    },
};
