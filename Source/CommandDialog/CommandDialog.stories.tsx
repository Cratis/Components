// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CommandDialog } from './CommandDialog';
import { Command, CommandValidator } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { InputTextField, NumberField } from '../CommandForm/fields';
import '@cratis/arc/validation';

const meta: Meta<typeof CommandDialog> = {
    title: 'CommandDialog/CommandDialog',
    component: CommandDialog,
};

export default meta;
type Story = StoryObj<typeof CommandDialog>;

class UpdateUserCommandValidator extends CommandValidator {
    constructor() {
        super();
        this.ruleFor((c: UpdateUserCommand) => c.name).notEmpty().minLength(2).maxLength(50);
        this.ruleFor((c: UpdateUserCommand) => c.email).notEmpty().emailAddress();
        this.ruleFor((c: UpdateUserCommand) => c.age).greaterThanOrEqual(18).lessThanOrEqual(120);
    }
}

class UpdateUserCommand extends Command<object> {
    readonly route: string = '/api/users/update';
    readonly validation: CommandValidator = new UpdateUserCommandValidator();
    readonly propertyDescriptors: PropertyDescriptor[] = [
        new PropertyDescriptor('name', String),
        new PropertyDescriptor('email', String),
        new PropertyDescriptor('age', Number),
    ];

    name = '';
    email = '';
    age = 0;

    constructor() {
        super(Object, false);
    }

    get requestParameters(): string[] {
        return [];
    }

    get properties(): string[] {
        return ['name', 'email', 'age'];
    }
}

const DialogWrapper = () => {
    const [visible, setVisible] = useState(true);
    const [result, setResult] = useState<string>('');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    return (
        <div className="storybook-wrapper">
            <button
                className="p-button p-component mb-3"
                onClick={() => {
                    setVisible(true);
                    setValidationErrors([]);
                    setResult('');
                }}
            >
                Open Dialog
            </button>

            {validationErrors.length > 0 && (
                <div className="p-3 mt-3 bg-red-100 border-round">
                    <strong>Validation Errors:</strong>
                    <ul className="mt-2 mb-0">
                        {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {result && (
                <div className="p-3 mt-3 bg-green-100 border-round">
                    <strong>Command executed:</strong> {result}
                </div>
            )}

            <CommandDialog<UpdateUserCommand>
                command={UpdateUserCommand}
                visible={visible}
                header="Update User Information (with Validation)"
                confirmLabel="Save"
                cancelLabel="Cancel"
                onConfirm={async (commandResult) => {
                    setResult(JSON.stringify(commandResult));
                    setVisible(false);
                }}
                onCancel={() => setVisible(false)}
                onFieldChange={async (command) => {
                    // Progressive validation - validate as fields change
                    const validationResult = await command.validate();
                    
                    if (!validationResult.isValid) {
                        setValidationErrors(validationResult.validationResults.map(v => v.message));
                    } else {
                        setValidationErrors([]);
                    }
                }}
            >
                <InputTextField value={(c: UpdateUserCommand) => c.name} title="Name" placeholder="Enter name (min 2 chars)" />
                <InputTextField value={(c: UpdateUserCommand) => c.email} title="Email" placeholder="Enter email" type="email" />
                <NumberField value={(c: UpdateUserCommand) => c.age} title="Age" placeholder="Enter age (18-120)" />
            </CommandDialog>
        </div>
    );
};

export const Default: Story = {
    render: () => <DialogWrapper />,
};
