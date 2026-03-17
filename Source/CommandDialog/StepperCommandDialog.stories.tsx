// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { StepperCommandDialog } from './StepperCommandDialog';
import { Command, CommandResult, CommandValidator } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { InputTextField, NumberField, TextAreaField } from '../CommandForm/fields';
import { DialogResult, useDialog, useDialogContext } from '@cratis/arc.react/dialogs';
import { StepperPanel } from 'primereact/stepperpanel';
import '@cratis/arc/validation';

const meta: Meta<typeof StepperCommandDialog> = {
    title: 'CommandDialog/StepperCommandDialog',
    component: StepperCommandDialog,
};

export default meta;
type Story = StoryObj<typeof StepperCommandDialog>;

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
}

/** Command that simulates a 2-second server delay to demonstrate the busy state. */
class SlowCreateProjectCommand extends CreateProjectCommand {
    override async execute(): Promise<CommandResult<object>> {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return CommandResult.empty;
    }
}

export const Default: Story = {
    render: () => {
        const [result, setResult] = useState<string>('');

        const CreateProjectDialogComponent = () => {
            const { closeDialog } = useDialogContext<CommandResult<object>>();

            return (
                <StepperCommandDialog<CreateProjectCommand>
                    command={CreateProjectCommand}
                    title="Create New Project"
                    okLabel="Create"
                    autoServerValidate={false}
                    onConfirm={async () => closeDialog(DialogResult.Ok)}
                    onCancel={() => closeDialog(DialogResult.Cancelled)}
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
                </StepperCommandDialog>
            );
        };

        const [CreateProjectDialogWrapper, showCreateProjectDialog] = useDialog<CommandResult<object>>(CreateProjectDialogComponent);

        return (
            <div className="storybook-wrapper">
                <button
                    className="p-button p-component mb-3"
                    onClick={async () => {
                        const [dialogResult, commandResult] = await showCreateProjectDialog();
                        if (dialogResult === DialogResult.Ok && commandResult) {
                            setResult(JSON.stringify(commandResult));
                        } else {
                            setResult('Cancelled');
                        }
                    }}
                >
                    Open Dialog
                </button>

                {result && (
                    <div className="p-3 mt-3 bg-green-100 border-round">
                        <strong>Result:</strong> {result}
                    </div>
                )}

                <CreateProjectDialogWrapper />
            </div>
        );
    },
};

export const ThreeSteps: Story = {
    render: () => {
        const [visible, setVisible] = useState(false);
        const [result, setResult] = useState<string>('');

        return (
            <div className="storybook-wrapper">
                <button
                    className="p-button p-component mb-3"
                    onClick={() => {
                        setVisible(true);
                        setResult('');
                    }}
                >
                    Open Three-Step Dialog
                </button>

                {result && (
                    <div className="p-3 mt-3 bg-green-100 border-round">
                        <strong>Submitted:</strong> {result}
                    </div>
                )}

                <StepperCommandDialog<CreateProjectCommand>
                    command={CreateProjectCommand}
                    visible={visible}
                    title="Create New Project (3 Steps)"
                    okLabel="Create"
                    autoServerValidate={false}
                    onConfirm={async () => {
                        setResult('Project created successfully');
                        setVisible(false);
                    }}
                    onCancel={() => setVisible(false)}
                >
                    <StepperPanel header="Contact Info">
                        <InputTextField<CreateProjectCommand>
                            value={c => c.email}
                            title="Contact Email"
                            placeholder="Enter contact email"
                            type="email"
                        />
                    </StepperPanel>
                    <StepperPanel header="Project Name">
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
                        <NumberField<CreateProjectCommand>
                            value={c => c.budget}
                            title="Budget"
                            placeholder="Enter budget (must be > 0)"
                        />
                    </StepperPanel>
                </StepperCommandDialog>
            </div>
        );
    },
};

export const WithBusyState: Story = {
    render: () => {
        const [visible, setVisible] = useState(false);

        return (
            <div className="storybook-wrapper">
                <p className="mb-3 text-sm text-color-secondary">
                    Simulates a 2-second server delay. Fill all fields and click Submit to see the busy state.
                </p>
                <button
                    className="p-button p-component mb-3"
                    onClick={() => setVisible(true)}
                >
                    Open Dialog
                </button>

                <StepperCommandDialog<SlowCreateProjectCommand>
                    command={SlowCreateProjectCommand}
                    visible={visible}
                    title="Create New Project (Slow)"
                    okLabel="Create"
                    autoServerValidate={false}
                    onConfirm={async () => setVisible(false)}
                    onCancel={() => setVisible(false)}
                >
                    <StepperPanel header="Basic Info">
                        <InputTextField<SlowCreateProjectCommand>
                            value={c => c.name}
                            title="Project Name"
                            placeholder="Enter project name"
                        />
                        <InputTextField<SlowCreateProjectCommand>
                            value={c => c.email}
                            title="Contact Email"
                            placeholder="Enter contact email"
                            type="email"
                        />
                    </StepperPanel>
                    <StepperPanel header="Details">
                        <TextAreaField<SlowCreateProjectCommand>
                            value={c => c.description}
                            title="Description"
                            placeholder="Describe the project"
                            rows={4}
                        />
                        <NumberField<SlowCreateProjectCommand>
                            value={c => c.budget}
                            title="Budget"
                            placeholder="Enter budget"
                        />
                    </StepperPanel>
                </StepperCommandDialog>
            </div>
        );
    },
};
