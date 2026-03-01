// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CommandDialog } from './CommandDialog';
import { Command, CommandResult, CommandValidator } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { InputTextField, NumberField, TextAreaField } from '../CommandForm/fields';
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

    override async validate(): Promise<CommandResult<object>> {
        const errors = this.validation?.validate(this) ?? [];
        if (errors.length > 0) {
            return CommandResult.validationFailed(errors);
        }
        return CommandResult.empty;
    }
}

/** Variant that keeps the original server-calling validate() for the WithServerValidation story. */
class UpdateUserCommandWithServer extends Command<object> {
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
                autoServerValidate={false}
                onConfirm={async (commandResult) => {
                    setResult(JSON.stringify(commandResult));
                    setVisible(false);
                }}
                onCancel={() => setVisible(false)}
                onFieldChange={(command) => {
                    // Client-side only validation - validate as fields change
                    const errors = command.validation?.validate(command) ?? [];
                    setValidationErrors(errors.map(v => v.message));
                }}
            >
                <InputTextField value={(c: UpdateUserCommand) => c.name} title="Name" placeholder="Enter name (min 2 chars)" />
                <InputTextField value={(c: UpdateUserCommand) => c.email} title="Email" placeholder="Enter email" type="email" />
                <NumberField value={(c: UpdateUserCommand) => c.age} title="Age" placeholder="Enter age (18-120)" />
            </CommandDialog>
        </div>
    );
};

const ServerValidationWrapper = () => {
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

            <CommandDialog<UpdateUserCommandWithServer>
                command={UpdateUserCommandWithServer}
                visible={visible}
                header="Update User Information (with Server Validation)"
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
                <InputTextField value={(c: UpdateUserCommandWithServer) => c.name} title="Name" placeholder="Enter name (min 2 chars)" />
                <InputTextField value={(c: UpdateUserCommandWithServer) => c.email} title="Email" placeholder="Enter email" type="email" />
                <NumberField value={(c: UpdateUserCommandWithServer) => c.age} title="Age" placeholder="Enter age (18-120)" />
            </CommandDialog>
        </div>
    );
};

export const Default: Story = {
    render: () => <DialogWrapper />,
};

export const WithServerValidation: Story = {
    render: () => <ServerValidationWrapper />,
};

const EditUserWrapper = () => {
    const [visible, setVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ name: string; email: string; age: number } | undefined>(undefined);
    const [result, setResult] = useState<string>('');

    const users = [
        { name: 'Jane Doe', email: 'jane@example.com', age: 30 },
        { name: 'John Smith', email: 'john@example.com', age: 45 },
    ];

    const handleEdit = (user: typeof users[0]) => {
        setSelectedUser(user);
        setResult('');
        setVisible(true);
    };

    return (
        <div className="storybook-wrapper">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {users.map(user => (
                    <button
                        key={user.email}
                        className="p-button p-component"
                        onClick={() => handleEdit(user)}
                    >
                        Edit {user.name}
                    </button>
                ))}
            </div>

            {result && (
                <div className="p-3 mt-3 bg-green-100 border-round">
                    <strong>Saved:</strong> {result}
                </div>
            )}

            <CommandDialog<UpdateUserCommand>
                command={UpdateUserCommand}
                key={selectedUser?.email ?? 'empty'}
                initialValues={selectedUser}
                visible={visible}
                header={`Edit User: ${selectedUser?.name ?? ''}`}
                confirmLabel="Save"
                cancelLabel="Cancel"
                autoServerValidate={false}
                onConfirm={async () => {
                    setResult(`User "${selectedUser?.name}" updated successfully`);
                    setVisible(false);
                }}
                onCancel={() => setVisible(false)}
            >
                <InputTextField value={(c: UpdateUserCommand) => c.name} title="Name" placeholder="Enter name" />
                <InputTextField value={(c: UpdateUserCommand) => c.email} title="Email" placeholder="Enter email" type="email" />
                <NumberField value={(c: UpdateUserCommand) => c.age} title="Age" placeholder="Enter age" />
            </CommandDialog>
        </div>
    );
};

export const WithInitialValues: Story = {
    render: () => <EditUserWrapper />,
};

const CustomValidationWrapper = () => {
    const [visible, setVisible] = useState(true);
    const [result, setResult] = useState<string>('');

    return (
        <div className="storybook-wrapper">
            <button
                className="p-button p-component mb-3"
                onClick={() => {
                    setResult('');
                    setVisible(true);
                }}
            >
                Open Dialog
            </button>

            {result && (
                <div className="p-3 mt-3 bg-green-100 border-round">
                    <strong>Saved:</strong> {result}
                </div>
            )}

            <CommandDialog<UpdateUserCommand>
                command={UpdateUserCommand}
                visible={visible}
                header="Add User (with Custom Validation)"
                confirmLabel="Save"
                cancelLabel="Cancel"
                autoServerValidate={false}
                onConfirm={async () => {
                    setResult('User added successfully');
                    setVisible(false);
                }}
                onCancel={() => setVisible(false)}
                onFieldValidate={(_command, fieldName, _oldValue, newValue) => {
                    if (fieldName === 'name') {
                        const name = newValue as string;
                        if (name && name.toLowerCase().includes('test')) {
                            return 'Name cannot contain the word "test"';
                        }
                        if (name && !/^[a-zA-Z\s]+$/.test(name)) {
                            return 'Name can only contain letters and spaces';
                        }
                    }
                    if (fieldName === 'email') {
                        const email = newValue as string;
                        if (email && email.endsWith('@example.com')) {
                            return 'Please use a real email address, not @example.com';
                        }
                    }
                    return undefined;
                }}
            >
                <InputTextField value={(c: UpdateUserCommand) => c.name} title="Name" placeholder='Try "test123" or numbers' />
                <InputTextField value={(c: UpdateUserCommand) => c.email} title="Email" placeholder='Try user@example.com' type="email" />
                <NumberField value={(c: UpdateUserCommand) => c.age} title="Age" placeholder="Enter age (18-120)" />
            </CommandDialog>
        </div>
    );
};

export const WithCustomValidation: Story = {
    render: () => <CustomValidationWrapper />,
};

const ValidationOnBlurWrapper = () => {
    const [visible, setVisible] = useState(true);

    return (
        <div className="storybook-wrapper">
            <button className="p-button p-component mb-3" onClick={() => setVisible(true)}>
                Open Dialog
            </button>
            <CommandDialog<UpdateUserCommand>
                command={UpdateUserCommand}
                visible={visible}
                header="Validation on Blur"
                confirmLabel="Save"
                cancelLabel="Cancel"
                validateOn="blur"
                autoServerValidate={false}
                onConfirm={async () => setVisible(false)}
                onCancel={() => setVisible(false)}
            >
                <InputTextField value={(c: UpdateUserCommand) => c.name} title="Name" placeholder="Click away to validate" />
                <InputTextField value={(c: UpdateUserCommand) => c.email} title="Email" placeholder="Click away to validate" type="email" />
                <NumberField value={(c: UpdateUserCommand) => c.age} title="Age" placeholder="Click away to validate" />
            </CommandDialog>
        </div>
    );
};

export const ValidationOnBlur: Story = {
    render: () => <ValidationOnBlurWrapper />,
};

const ValidationOnChangeWrapper = () => {
    const [visible, setVisible] = useState(true);

    return (
        <div className="storybook-wrapper">
            <button className="p-button p-component mb-3" onClick={() => setVisible(true)}>
                Open Dialog
            </button>
            <CommandDialog<UpdateUserCommand>
                command={UpdateUserCommand}
                visible={visible}
                header="Validation on Change"
                confirmLabel="Save"
                cancelLabel="Cancel"
                validateOn="change"
                autoServerValidate={false}
                onConfirm={async () => setVisible(false)}
                onCancel={() => setVisible(false)}
            >
                <InputTextField value={(c: UpdateUserCommand) => c.name} title="Name" placeholder="Errors appear while typing" />
                <InputTextField value={(c: UpdateUserCommand) => c.email} title="Email" placeholder="Errors appear while typing" type="email" />
                <NumberField value={(c: UpdateUserCommand) => c.age} title="Age" placeholder="Errors appear while typing" />
            </CommandDialog>
        </div>
    );
};

export const ValidationOnChange: Story = {
    render: () => <ValidationOnChangeWrapper />,
};

const ValidateOnInitWrapper = () => {
    const [visible, setVisible] = useState(true);

    return (
        <div className="storybook-wrapper">
            <button className="p-button p-component mb-3" onClick={() => setVisible(true)}>
                Open Dialog
            </button>
            <CommandDialog<UpdateUserCommand>
                command={UpdateUserCommand}
                visible={visible}
                header="Validate on Initialization"
                confirmLabel="Save"
                cancelLabel="Cancel"
                validateOnInit={true}
                autoServerValidate={false}
                initialValues={{ name: 'A', email: 'invalid', age: 10 }}
                onConfirm={async () => setVisible(false)}
                onCancel={() => setVisible(false)}
            >
                <InputTextField value={(c: UpdateUserCommand) => c.name} title="Name" placeholder="Errors shown immediately" />
                <InputTextField value={(c: UpdateUserCommand) => c.email} title="Email" placeholder="Errors shown immediately" type="email" />
                <NumberField value={(c: UpdateUserCommand) => c.age} title="Age" placeholder="Errors shown immediately" />
            </CommandDialog>
        </div>
    );
};

export const ValidateOnInit: Story = {
    render: () => <ValidateOnInitWrapper />,
};

const ValidateAllFieldsWrapper = () => {
    const [visible, setVisible] = useState(true);

    return (
        <div className="storybook-wrapper">
            <button className="p-button p-component mb-3" onClick={() => setVisible(true)}>
                Open Dialog
            </button>
            <CommandDialog<UpdateUserCommand>
                command={UpdateUserCommand}
                visible={visible}
                header="Validate All Fields on Change"
                confirmLabel="Save"
                cancelLabel="Cancel"
                validateOn="blur"
                validateAllFieldsOnChange={true}
                autoServerValidate={false}
                onConfirm={async () => setVisible(false)}
                onCancel={() => setVisible(false)}
            >
                <InputTextField value={(c: UpdateUserCommand) => c.name} title="Name" placeholder="Blur one field — all validate" />
                <InputTextField value={(c: UpdateUserCommand) => c.email} title="Email" placeholder="Blur one field — all validate" type="email" />
                <NumberField value={(c: UpdateUserCommand) => c.age} title="Age" placeholder="Blur one field — all validate" />
            </CommandDialog>
        </div>
    );
};

export const ValidateAllFieldsOnChange: Story = {
    render: () => <ValidateAllFieldsWrapper />,
};

const BeforeExecuteWrapper = () => {
    const [visible, setVisible] = useState(true);
    const [preprocessedData, setPreprocessedData] = useState<string>('');

    return (
        <div className="storybook-wrapper">
            <button className="p-button p-component mb-3" onClick={() => { setVisible(true); setPreprocessedData(''); }}>
                Open Dialog
            </button>

            {preprocessedData && (
                <div className="p-3 mt-3 bg-green-100 border-round">
                    <strong>Preprocessed before submit:</strong>
                    <pre style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>{preprocessedData}</pre>
                </div>
            )}

            <CommandDialog<UpdateUserCommand>
                command={UpdateUserCommand}
                visible={visible}
                header="Before Execute Callback"
                confirmLabel="Save"
                cancelLabel="Cancel"
                autoServerValidate={false}
                initialValues={{ name: '', email: '', age: 18 }}
                onBeforeExecute={(command) => {
                    command.name = command.name.trim().replace(/\s+/g, ' ');
                    command.email = command.email.toLowerCase().trim();
                    return command;
                }}
                onConfirm={async (result) => {
                    setPreprocessedData(JSON.stringify(result, null, 2));
                    setVisible(false);
                }}
                onCancel={() => setVisible(false)}
            >
                <InputTextField value={(c: UpdateUserCommand) => c.name} title="Name" placeholder='Try "  Extra   Spaces  "' />
                <InputTextField value={(c: UpdateUserCommand) => c.email} title="Email" placeholder="Try UPPERCASE@EMAIL.COM" type="email" />
                <NumberField value={(c: UpdateUserCommand) => c.age} title="Age" placeholder="Enter age (18-120)" />
            </CommandDialog>
        </div>
    );
};

export const BeforeExecute: Story = {
    render: () => <BeforeExecuteWrapper />,
};

const WithIconsWrapper = () => {
    const [visible, setVisible] = useState(true);

    return (
        <div className="storybook-wrapper">
            <button className="p-button p-component mb-3" onClick={() => setVisible(true)}>
                Open Dialog
            </button>
            <CommandDialog<UpdateUserCommand>
                command={UpdateUserCommand}
                visible={visible}
                header="Fields with Icons"
                confirmLabel="Save"
                cancelLabel="Cancel"
                autoServerValidate={false}
                onConfirm={async () => setVisible(false)}
                onCancel={() => setVisible(false)}
            >
                <InputTextField
                    value={(c: UpdateUserCommand) => c.name}
                    title="Name"
                    placeholder="Enter name"
                    icon={<span style={{ fontSize: '1.25rem' }}>👤</span>}
                />
                <InputTextField
                    value={(c: UpdateUserCommand) => c.email}
                    title="Email"
                    placeholder="Enter email"
                    type="email"
                    icon={<span style={{ fontSize: '1.25rem' }}>📧</span>}
                />
                <NumberField
                    value={(c: UpdateUserCommand) => c.age}
                    title="Age"
                    placeholder="Enter age"
                    icon={<span style={{ fontSize: '1.25rem' }}>🎂</span>}
                />
            </CommandDialog>
        </div>
    );
};

export const WithIcons: Story = {
    render: () => <WithIconsWrapper />,
};

class UpdateProfileCommandValidator extends CommandValidator {
    constructor() {
        super();
        this.ruleFor((c: UpdateProfileCommand) => c.firstName).notEmpty().minLength(2);
        this.ruleFor((c: UpdateProfileCommand) => c.lastName).notEmpty().minLength(2);
        this.ruleFor((c: UpdateProfileCommand) => c.email).notEmpty().emailAddress();
        this.ruleFor((c: UpdateProfileCommand) => c.phone).notEmpty();
        this.ruleFor((c: UpdateProfileCommand) => c.bio).notEmpty().minLength(10);
    }
}

class UpdateProfileCommand extends Command<object> {
    readonly route: string = '/api/profile/update';
    readonly validation: CommandValidator = new UpdateProfileCommandValidator();
    readonly propertyDescriptors: PropertyDescriptor[] = [
        new PropertyDescriptor('firstName', String),
        new PropertyDescriptor('lastName', String),
        new PropertyDescriptor('email', String),
        new PropertyDescriptor('phone', String),
        new PropertyDescriptor('bio', String),
    ];

    firstName = '';
    lastName = '';
    email = '';
    phone = '';
    bio = '';

    constructor() {
        super(Object, false);
    }

    get requestParameters(): string[] {
        return [];
    }

    get properties(): string[] {
        return ['firstName', 'lastName', 'email', 'phone', 'bio'];
    }

    override async validate(): Promise<CommandResult<object>> {
        const errors = this.validation?.validate(this) ?? [];
        if (errors.length > 0) {
            return CommandResult.validationFailed(errors);
        }
        return CommandResult.empty;
    }
}

const MultiColumnWrapper = () => {
    const [visible, setVisible] = useState(true);

    return (
        <div className="storybook-wrapper">
            <button className="p-button p-component mb-3" onClick={() => setVisible(true)}>
                Open Dialog
            </button>
            <CommandDialog<UpdateProfileCommand>
                command={UpdateProfileCommand}
                visible={visible}
                header="Edit Profile"
                confirmLabel="Save"
                cancelLabel="Cancel"
                width="70vw"
                autoServerValidate={false}
                onConfirm={async () => setVisible(false)}
                onCancel={() => setVisible(false)}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <CommandDialog.Column>
                        <InputTextField value={(c: UpdateProfileCommand) => c.firstName} title="First Name" placeholder="Enter first name" />
                        <InputTextField value={(c: UpdateProfileCommand) => c.email} title="Email" placeholder="Enter email" type="email" />
                    </CommandDialog.Column>
                    <CommandDialog.Column>
                        <InputTextField value={(c: UpdateProfileCommand) => c.lastName} title="Last Name" placeholder="Enter last name" />
                        <InputTextField value={(c: UpdateProfileCommand) => c.phone} title="Phone" placeholder="Enter phone number" />
                    </CommandDialog.Column>
                </div>
                <TextAreaField value={(c: UpdateProfileCommand) => c.bio} title="Bio" placeholder="Tell us about yourself" rows={3} />
            </CommandDialog>
        </div>
    );
};

export const MultiColumnLayout: Story = {
    render: () => <MultiColumnWrapper />,
};

const MixedChildrenWrapper = () => {
    const [visible, setVisible] = useState(true);

    return (
        <div className="storybook-wrapper">
            <button className="p-button p-component mb-3" onClick={() => setVisible(true)}>
                Open Dialog
            </button>
            <CommandDialog<UpdateProfileCommand>
                command={UpdateProfileCommand}
                visible={visible}
                header="Edit Profile (Mixed Children)"
                confirmLabel="Save"
                cancelLabel="Cancel"
                autoServerValidate={false}
                onConfirm={async () => setVisible(false)}
                onCancel={() => setVisible(false)}
            >
                <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Personal Information</h3>
                <InputTextField value={(c: UpdateProfileCommand) => c.firstName} title="First Name" placeholder="Enter first name" />
                <InputTextField value={(c: UpdateProfileCommand) => c.lastName} title="Last Name" placeholder="Enter last name" />

                <h3 style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>Contact Details</h3>
                <InputTextField value={(c: UpdateProfileCommand) => c.email} title="Email" placeholder="Enter email" type="email" />
                <InputTextField value={(c: UpdateProfileCommand) => c.phone} title="Phone" placeholder="Enter phone number" />

                <h3 style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>About You</h3>
                <TextAreaField value={(c: UpdateProfileCommand) => c.bio} title="Bio" placeholder="Tell us about yourself (min 10 chars)" rows={3} />
            </CommandDialog>
        </div>
    );
};

export const MixedChildren: Story = {
    render: () => <MixedChildrenWrapper />,
};
