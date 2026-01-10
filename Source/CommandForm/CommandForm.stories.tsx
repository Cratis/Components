// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CommandForm } from './CommandForm';
import { ValidationMessage } from './ValidationMessage';
import { UserRegistrationCommand } from './UserRegistrationCommand';
import { 
    InputTextField, 
    NumberField, 
    TextAreaField, 
    CheckboxField, 
    RangeField,
    SelectField 
} from './fields';
import { Button } from 'primereact/button';

const meta: Meta<typeof CommandForm> = {
    title: 'CommandForm/CommandForm',
    component: CommandForm,
};

export default meta;
type Story = StoryObj<typeof CommandForm>;

const roleOptions = [
    { id: 'user', name: 'User' },
    { id: 'admin', name: 'Administrator' },
    { id: 'moderator', name: 'Moderator' }
];

export const Default: Story = {
    args: {},
    render: (args) => (
        <div className="storybook-wrapper">
            <CommandForm {...args} />
        </div>
    )
};

export const UserRegistration: Story = {
    render: () => {
        const [result, setResult] = useState<string>('');

        const handleSubmit = () => {
            setResult('Form submitted successfully!');
        };

        return (
            <div className="p-8 w-[800px] mx-auto">
                <h2 className="text-2xl font-bold mb-6">User Registration Form</h2>
                
                <h3 className="text-xl font-semibold mb-4 mt-6">Account Information</h3>
                <CommandForm<UserRegistrationCommand>
                    command={UserRegistrationCommand}
                    initialValues={{
                        username: '',
                        email: '',
                        password: '',
                        confirmPassword: '',
                        age: 18,
                        bio: '',
                        favoriteColor: '#3b82f6',
                        birthDate: '',
                        agreeToTerms: false,
                        experienceLevel: 50,
                        role: ''
                    }}
                    onFieldChange={(cmd, fieldName, oldValue, newValue) => {
                        console.log(`Field ${fieldName} changed from`, oldValue, 'to', newValue);
                    }}
                >
                    <InputTextField<UserRegistrationCommand> value={c => c.username} title="Username" placeholder="Enter username" />
                    <ValidationMessage<UserRegistrationCommand> value={c => c.username} />
                    
                    <InputTextField<UserRegistrationCommand> value={c => c.email} title="Email Address" type="email" placeholder="Enter email" />
                    <ValidationMessage<UserRegistrationCommand> value={c => c.email} />
                    
                    <InputTextField<UserRegistrationCommand> value={c => c.password} title="Password" type="password" placeholder="Enter password" />
                    <ValidationMessage<UserRegistrationCommand> value={c => c.password} />
                    
                    <InputTextField<UserRegistrationCommand> value={c => c.confirmPassword} title="Confirm Password" type="password" placeholder="Confirm password" />
                    <ValidationMessage<UserRegistrationCommand> value={c => c.confirmPassword} />

                    <h3 className="text-xl font-semibold mb-0 mt-6">Personal Information</h3>
                    <NumberField<UserRegistrationCommand> value={c => c.age} title="Age" placeholder="Enter age" min={13} max={120} />
                    <ValidationMessage<UserRegistrationCommand> value={c => c.age} />
                    
                    <InputTextField<UserRegistrationCommand> value={c => c.birthDate} title="Birth Date" type="date" placeholder="Select birth date" />
                    <ValidationMessage<UserRegistrationCommand> value={c => c.birthDate} />
                    
                    <TextAreaField<UserRegistrationCommand> value={c => c.bio} title="Bio" placeholder="Tell us about yourself" rows={4} required={false} />
                    <ValidationMessage<UserRegistrationCommand> value={c => c.bio} />
                    
                    <InputTextField<UserRegistrationCommand> value={c => c.favoriteColor} title="Favorite Color" type="color" />
                    <ValidationMessage<UserRegistrationCommand> value={c => c.favoriteColor} />

                    <h3 className="text-xl font-semibold mb-0 mt-6">Preferences</h3>
                    <SelectField<UserRegistrationCommand>
                        value={c => c.role}
                        title="Role"
                        options={roleOptions} 
                        optionIdField="id" 
                        optionLabelField="name"
                        placeholder="Select a role"
                    />
                    <ValidationMessage<UserRegistrationCommand> value={c => c.role} />
                    
                    <RangeField<UserRegistrationCommand> value={c => c.experienceLevel} title="Experience Level" min={0} max={100} step={10} />
                    <ValidationMessage<UserRegistrationCommand> value={c => c.experienceLevel} />
                    
                    <CheckboxField<UserRegistrationCommand> value={c => c.agreeToTerms} title="Terms & Conditions" label="I agree to the terms and conditions" />
                    <ValidationMessage<UserRegistrationCommand> value={c => c.agreeToTerms} />
                </CommandForm>

                <div className="flex gap-2 mt-6">
                    <Button label="Submit" onClick={handleSubmit} severity="success" />
                    <Button label="Cancel" onClick={() => setResult('')} severity="secondary" />
                </div>

                {result && (
                    <div className="bg-green-100 p-4 rounded-lg mt-4 border border-green-300">
                        <p className="text-green-800 font-semibold m-0">{result}</p>
                    </div>
                )}
            </div>
        );
    }
};
