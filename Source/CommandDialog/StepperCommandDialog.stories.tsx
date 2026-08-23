// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { StepperCommandDialog } from './StepperCommandDialog';
import { Command, CommandResult, CommandValidator } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { InputTextField, NumberField, TextAreaField } from '../CommandForm/fields';
import { DialogResult, useDialog, useDialogContext } from '@cratis/arc.react/dialogs';
import { StepperPanel } from './StepperPanel';
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
                <button className="cratis-button cratis:mb-3" data-variant="filled" data-severity="secondary" data-size="normal" onClick={async () => {
                    const [dialogResult, commandResult] = await showCreateProjectDialog();
                    if (dialogResult === DialogResult.Ok && commandResult) {
                        setResult(JSON.stringify(commandResult));
                    } else {
                        setResult('Cancelled');
                    }
                }}>
                    Open Dialog
                </button>

                {result && (
                    <div className="cratis:p-3 cratis:mt-3 cratis:bg-green-100 border-round">
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
                <button className="cratis-button cratis:mb-3" data-variant="filled" data-severity="secondary" data-size="normal" onClick={() => {
                    setVisible(true);
                    setResult('');
                }}>
                    Open Three-Step Dialog
                </button>

                {result && (
                    <div className="cratis:p-3 cratis:mt-3 cratis:bg-green-100 border-round">
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

export const WithValidationIndicators: Story = {
    render: () => {
        const [visible, setVisible] = useState(true);

        return (
            <div className="storybook-wrapper">
                <p className="cratis:mb-3 cratis:text-sm text-color-secondary">
                    <code>validateOnInit</code> triggers validation immediately — step indicators appear on
                    any step whose fields are invalid right from the start.
                </p>
                <button className="cratis-button cratis:mb-3" data-variant="filled" data-severity="secondary" data-size="normal" onClick={() => setVisible(true)}>
                    Open Dialog
                </button>

                <StepperCommandDialog<CreateProjectCommand>
                    command={CreateProjectCommand}
                    visible={visible}
                    title="New Project"
                    okLabel="Create"
                    autoServerValidate={false}
                    validateOnInit
                    onConfirm={async () => setVisible(false)}
                    onCancel={() => setVisible(false)}
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
            </div>
        );
    },
};

export const WithBusyState: Story = {
    render: () => {
        const [visible, setVisible] = useState(false);

        return (
            <div className="storybook-wrapper">
                <p className="cratis:mb-3 cratis:text-sm text-color-secondary">
                    Simulates a 2-second server delay. Fill all fields and click Submit to see the busy state.
                </p>
                <button className="cratis-button cratis:mb-3" data-variant="filled" data-severity="secondary" data-size="normal" onClick={() => setVisible(true)}>
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

/** Demonstrates typed response handling with success and failure callbacks. */
export const WithResponseTypeAndCallbacks: Story = {
    render: () => {
        const [visible, setVisible] = useState(true);
        const [result, setResult] = useState<string>('');
        const [error, setError] = useState<string>('');

        type CreateProjectResponse = {
            projectId: string;
            projectName: string;
            message: string;
        };

        class CreateProjectWithResponseCommand extends Command<CreateProjectResponse> {
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

            override async validate(): Promise<CommandResult<CreateProjectResponse>> {
                const errors = this.validation?.validate(this) ?? [];
                if (errors.length > 0) {
                    return CommandResult.validationFailed(errors) as CommandResult<CreateProjectResponse>;
                }
                return CommandResult.empty as CommandResult<CreateProjectResponse>;
            }

            override async execute(): Promise<CommandResult<CreateProjectResponse>> {
                // In real usage, the server would return a CommandResult with a typed response
                // For this story, we just demonstrate the type safety
                await new Promise(resolve => setTimeout(resolve, 500));
                return CommandResult.empty as CommandResult<CreateProjectResponse>;
            }
        }

        return (
            <div className="storybook-wrapper">
                <button className="cratis-button cratis:mb-3" data-variant="filled" data-severity="secondary" data-size="normal" onClick={() => {
                    setResult('');
                    setError('');
                    setVisible(true);
                }}>
                    Open Dialog
                </button>

                {result && (
                    <div className="cratis:p-3 cratis:mt-3 cratis:bg-green-100 border-round">
                        <strong>Success:</strong> {result}
                    </div>
                )}

                {error && (
                    <div className="cratis:p-3 cratis:mt-3 cratis:bg-red-100 border-round">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <StepperCommandDialog<CreateProjectWithResponseCommand, CreateProjectResponse>
                    command={CreateProjectWithResponseCommand}
                    visible={visible}
                    title="Create Project (with Response Type)"
                    okLabel="Create"
                    autoServerValidate={false}
                    onSuccess={() => {
                        // Response type is fully typed - in real usage the response would contain data from the server
                        setResult(`Project created successfully! Response type is fully typed.`);
                        setVisible(false);
                    }}
                    onValidationFailure={(validationResults) => {
                        const errors = validationResults.map(r => r.message).join(', ');
                        setError(`Validation failed: ${errors}`);
                    }}
                    onFailed={(commandResult) => {
                        setError(`Command failed: ${commandResult.exceptionMessages?.join(', ') || 'Unknown error'}`);
                    }}
                    onCancel={() => setVisible(false)}
                >
                    <StepperPanel header="Basic Info">
                        <InputTextField<CreateProjectWithResponseCommand>
                            value={c => c.name}
                            title="Project Name"
                            placeholder="Enter project name"
                        />
                        <InputTextField<CreateProjectWithResponseCommand>
                            value={c => c.email}
                            title="Contact Email"
                            placeholder="Enter contact email"
                            type="email"
                        />
                    </StepperPanel>
                    <StepperPanel header="Details">
                        <TextAreaField<CreateProjectWithResponseCommand>
                            value={c => c.description}
                            title="Description"
                            placeholder="Describe the project"
                            rows={4}
                        />
                        <NumberField<CreateProjectWithResponseCommand>
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

/**
 * `showCancel` adds a Cancel button to the footer, where it leads every step on the dismissal side
 * of the divider, opposite Next and Submit; `cancelLabel` renames it. The command behind this
 * wizard takes two seconds, so submitting also shows what the busy window does to every route out
 * of the dialog: the footer Cancel greys out and the header X disappears until the command returns.
 */
export const WithFooterCancel: Story = {
    render: () => {
        const [visible, setVisible] = useState(false);
        const [outcome, setOutcome] = useState('');

        return (
            <div className="storybook-wrapper">
                <p className="cratis:mb-3 cratis:text-sm text-color-secondary">
                    The footer leads with a renamed Cancel. Fill both steps and click Create to run a 2-second
                    command — while it runs, neither the footer Cancel nor the header X can dismiss the dialog.
                </p>
                <button className="cratis-button cratis:mb-3" data-variant="filled" data-severity="secondary" data-size="normal" onClick={() => {
                    setOutcome('');
                    setVisible(true);
                }}>
                    Open Dialog
                </button>

                {outcome && (
                    <div className="cratis:p-3 cratis:mt-3 cratis:bg-green-100 border-round">
                        <strong>Outcome:</strong> {outcome}
                    </div>
                )}

                <StepperCommandDialog<SlowCreateProjectCommand>
                    command={SlowCreateProjectCommand}
                    visible={visible}
                    title="Create New Project"
                    okLabel="Create"
                    showCancel
                    cancelLabel="Discard draft"
                    autoServerValidate={false}
                    onConfirm={async () => {
                        setOutcome('Created');
                        setVisible(false);
                    }}
                    onCancel={() => {
                        setOutcome('Discarded');
                        setVisible(false);
                    }}
                >
                    <StepperPanel header="Basic Info">
                        <InputTextField<SlowCreateProjectCommand>
                            value={c => c.name}
                            title="Project Name"
                            placeholder="Enter project name (min 2 chars)"
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
                            placeholder="Describe the project (min 10 chars)"
                            rows={4}
                        />
                        <NumberField<SlowCreateProjectCommand>
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

/**
 * A step rendered as `{condition && <StepperPanel/>}` disappears entirely when the condition
 * is false. Toggle the optional step off and the dialog must behave as a genuine two-step
 * wizard: Submit shows on "Details" instead of a Next button that leads to an empty step.
 */
export const ConditionalSteps: Story = {
    render: () => {
        const [visible, setVisible] = useState(true);
        const [includeBudgetStep, setIncludeBudgetStep] = useState(false);
        const [result, setResult] = useState('');

        return (
            <div className="storybook-wrapper">
                <button className="cratis-button cratis:mb-3" data-variant="filled" data-severity="secondary" data-size="normal" onClick={() => setIncludeBudgetStep(current => !current)}>{includeBudgetStep ? 'Hide the optional Budget step' : 'Show the optional Budget step'}</button>
                <button className="cratis-button cratis:mb-3 cratis:ml-2" data-variant="filled" data-severity="secondary" data-size="normal" onClick={() => {
                    setResult('');
                    setVisible(true);
                }}>
                    Open Dialog
                </button>
                <p className="cratis:mb-3 cratis:text-sm text-color-secondary">
                    The Budget step is currently <strong>{includeBudgetStep ? 'shown' : 'hidden'}</strong>, so the
                    wizard has {includeBudgetStep ? 'three' : 'two'} steps.
                </p>

                {result && (
                    <div className="cratis:p-3 cratis:mt-3 cratis:bg-green-100 border-round">
                        <strong>Submitted:</strong> {result}
                    </div>
                )}

                <StepperCommandDialog<CreateProjectCommand>
                    command={CreateProjectCommand}
                    visible={visible}
                    title="Create New Project"
                    okLabel="Create"
                    autoServerValidate={false}
                    onConfirm={async () => {
                        setResult('Project created successfully');
                        setVisible(false);
                    }}
                    onCancel={() => setVisible(false)}
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
                </StepperCommandDialog>
            </div>
        );
    },
};
