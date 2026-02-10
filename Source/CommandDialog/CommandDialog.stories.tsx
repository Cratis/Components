// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CommandDialog } from './CommandDialog';
import { Command } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { InputTextField, NumberField } from '../CommandForm/fields';

const meta: Meta<typeof CommandDialog> = {
    title: 'CommandDialog/CommandDialog',
    component: CommandDialog,
};

export default meta;
type Story = StoryObj<typeof CommandDialog>;

class UpdateUserCommand extends Command<object> {
    readonly route: string = '/api/users/update';
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

    return (
        <div className="storybook-wrapper">
            <button 
                className="p-button p-component mb-3"
                onClick={() => setVisible(true)}
            >
                Open Dialog
            </button>
            
            {result && (
                <div className="p-3 mt-3 bg-green-100 border-round">
                    <strong>Command executed:</strong> {result}
                </div>
            )}
            
            <CommandDialog<UpdateUserCommand>
                command={UpdateUserCommand}
                visible={visible}
                header="Update User Information"
                confirmLabel="Save"
                cancelLabel="Cancel"
                onConfirm={(commandResult) => {
                    setResult(JSON.stringify(commandResult));
                    setVisible(false);
                }}
                onCancel={() => setVisible(false)}
            >
                <InputTextField<UpdateUserCommand> value={c => c.name} title="Name" placeholder="Enter name" />
                <InputTextField<UpdateUserCommand> value={c => c.email} title="Email" placeholder="Enter email" type="email" />
                <NumberField<UpdateUserCommand> value={c => c.age} title="Age" placeholder="Enter age" />
            </CommandDialog>
        </div>
    );
};

export const Default: Story = {
    render: () => <DialogWrapper />,
};
