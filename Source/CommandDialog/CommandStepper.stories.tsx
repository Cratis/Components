// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StepperPanel } from './StepperPanel';
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

class CreateProjectValidator extends CommandValidator<CreateProjectCommand> {
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
                    <div className="cratis:p-2 cratis:mt-3 border-round surface-100" style={{ border: '1px solid var(--cratis-surface-border)' }}>
                        {result}
                    </div>
                )}
            </div>
        );
    },
};

export const InDialogFrame: Story = {
    render: () => {
        const [result, setResult] = useState('');

        return (
            <div className="command-stepper-stories-background">
                <div className="command-stepper-stories-frame">
                    <div className="command-stepper-stories-header">
                        <h2>Create New Project</h2>
                    </div>
                    <div className="command-stepper-stories-content">
                        <CommandStepper<CreateProjectCommand>
                            command={CreateProjectCommand}
                            autoServerValidate={false}
                            validateOn="change"
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
                            <div className="cratis:p-2 cratis:mt-3 border-round surface-100" style={{ border: '1px solid var(--cratis-surface-border)' }}>
                                {result}
                            </div>
                        )}
                    </div>
                    <div className="command-stepper-stories-footer">
                        <button className="cratis-button" data-variant="outline" data-tone="neutral" data-severity="secondary" data-shape="default" data-size="normal" >Cancel</button>
                        <button  className="cratis-button" data-variant="solid" data-tone="neutral" data-severity="secondary" data-shape="default" data-size="normal" >Create</button>
                    </div>
                </div>
            </div>
        );
    },
};

export const InDialogFrameWithCenteredHeader: Story = {
    render: () => {
        const [result, setResult] = useState('');

        return (
            <div className="command-stepper-stories-background">
                <div className="command-stepper-stories-frame">
                    <div className="command-stepper-stories-header command-stepper-stories-header-centered">
                        <div className="command-stepper-stories-logo">
                            <div className="command-stepper-stories-logo-placeholder">LOGO</div>
                            <p className="command-stepper-stories-subtitle">Complete Your Setup</p>
                        </div>
                    </div>
                    <div className="command-stepper-stories-content">
                        <CommandStepper<CreateProjectCommand>
                            command={CreateProjectCommand}
                            autoServerValidate={false}
                            validateOn="change"
                            validateOnInit
                            nextLabel="Continue"
                            previousLabel="Back"
                            onSuccess={async () => setResult('Setup completed')}
                        >
                            <StepperPanel header="Organization">
                                <InputTextField<CreateProjectCommand>
                                    value={c => c.name}
                                    title="Organization Name"
                                    placeholder="Enter organization name"
                                />
                            </StepperPanel>
                            <StepperPanel header="Contact">
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
                                    placeholder="Describe your organization"
                                    rows={3}
                                />
                            </StepperPanel>
                        </CommandStepper>
                        {result && (
                            <div className="cratis:p-2 cratis:mt-3 border-round surface-100" style={{ border: '1px solid var(--cratis-surface-border)' }}>
                                {result}
                            </div>
                        )}
                    </div>
                    <div className="command-stepper-stories-footer">
                        <button className="cratis-button" data-variant="outline" data-tone="neutral" data-severity="secondary" data-shape="default" data-size="normal" >Cancel</button>
                        <button  className="cratis-button" data-variant="solid" data-tone="neutral" data-severity="secondary" data-shape="default" data-size="normal" >Complete</button>
                    </div>
                </div>
            </div>
        );
    },
};

export const Vertical: Story = {
    render: () => {
        const [result, setResult] = useState('');

        return (
            <div style={{ width: '700px', padding: '1.5rem' }}>
                <CommandStepper<CreateProjectCommand>
                    command={CreateProjectCommand}
                    autoServerValidate={false}
                    validateOn="change"
                    orientation="vertical"
                    start={<h3 style={{ margin: '0 0 1rem' }}>Create Project</h3>}
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
                    <div className="cratis:p-2 cratis:mt-3 border-round surface-100" style={{ border: '1px solid var(--cratis-surface-border)' }}>
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
                    <div className="cratis:p-2 cratis:mt-3 border-round surface-100" style={{ border: '1px solid var(--cratis-surface-border)' }}>
                        {result}
                    </div>
                )}
            </div>
        );
    },
};

/**
 * A step rendered as `{condition && <StepperPanel/>}` disappears entirely when the condition
 * is false. Toggle the optional step off and the wizard must behave as a genuine two-step
 * wizard: Submit shows on "Details" instead of a Next button that leads nowhere.
 */
export const ConditionalSteps: Story = {
    render: () => {
        const [includeBudgetStep, setIncludeBudgetStep] = useState(false);
        const [result, setResult] = useState('');

        return (
            <div style={{ width: '600px', padding: '1.5rem' }}>
                <button className="cratis-button cratis:mb-3" data-variant="solid" data-tone="neutral" data-severity="secondary" data-shape="default" data-size="normal" onClick={() => setIncludeBudgetStep(current => !current)}>{includeBudgetStep ? 'Hide the optional Budget step' : 'Show the optional Budget step'}</button>
                <p className="cratis:mb-3 cratis:text-sm text-color-secondary">
                    The Budget step is currently <strong>{includeBudgetStep ? 'shown' : 'hidden'}</strong>, so the
                    wizard has {includeBudgetStep ? 'three' : 'two'} steps.
                </p>

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
                    </StepperPanel>
                    <StepperPanel header="Details">
                        <TextAreaField<CreateProjectCommand>
                            value={c => c.description}
                            title="Description"
                            placeholder="Describe the project (min 10 chars)"
                            rows={4}
                        />
                    </StepperPanel>
                    {includeBudgetStep && (
                        <StepperPanel header="Budget">
                            <NumberField<CreateProjectCommand>
                                value={c => c.budget}
                                title="Budget"
                                placeholder="Enter budget (must be > 0)"
                            />
                        </StepperPanel>
                    )}
                </CommandStepper>

                {result && (
                    <div className="cratis:p-2 cratis:mt-3 border-round surface-100" style={{ border: '1px solid var(--cratis-surface-border)' }}>
                        {result}
                    </div>
                )}
            </div>
        );
    },
};
