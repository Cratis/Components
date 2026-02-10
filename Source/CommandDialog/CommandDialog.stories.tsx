// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CommandDialog } from './CommandDialog';
import { Command } from '@cratis/arc/commands';
import { CommandFormField } from '../CommandForm/CommandFormField';

const meta: Meta<typeof CommandDialog> = {
    title: 'CommandDialog/CommandDialog',
    component: CommandDialog,
};

export default meta;
type Story = StoryObj<typeof CommandDialog>;

class UpdateUserCommand extends Command<object> {
    name = '';
    email = '';
    age = 0;
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
            
            <CommandDialog
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
                <CommandDialog.Fields>
                    <CommandFormField name="name" label="Name" placeholder="Enter name" />
                    <CommandFormField name="email" label="Email" placeholder="Enter email" />
                    <CommandFormField name="age" label="Age" type="number" />
                </CommandDialog.Fields>
            </CommandDialog>
        </div>
    );
};

export const Default: Story = {
    render: () => <DialogWrapper />,
};
