// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { CommandForm } from '@cratis/arc.react/commands';
import { Command, CommandResult, CommandValidator } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { PasswordField } from './PasswordField';
import { ToggleSwitchField } from './ToggleSwitchField';
import { RatingField } from './RatingField';
import '@cratis/arc/validation';

const meta: Meta = {
    title: 'CommandForm/NewFields',
};

export default meta;
type Story = StoryObj;

class ProfileValidator extends CommandValidator {
    constructor() {
        super();
        this.ruleFor((c: ProfileCommand) => c.password).notEmpty().minLength(6);
    }
}

class ProfileCommand extends Command<object> {
    readonly route: string = '/api/profile';
    readonly validation: CommandValidator = new ProfileValidator();
    readonly propertyDescriptors: PropertyDescriptor[] = [
        new PropertyDescriptor('password', String),
        new PropertyDescriptor('notifications', Boolean),
        new PropertyDescriptor('rating', Number),
    ];

    password = '';
    notifications = false;
    rating = 0;

    constructor() {
        super(Object, false);
    }

    get requestParameters(): string[] {
        return [];
    }

    get properties(): string[] {
        return ['password', 'notifications', 'rating'];
    }

    override async validate(): Promise<CommandResult<object>> {
        const errors = this.validation?.validate(this) ?? [];
        return errors.length > 0 ? CommandResult.validationFailed(errors) : CommandResult.empty;
    }

    override async execute(): Promise<CommandResult<object>> {
        const validation = await this.validate();
        return validation.isSuccess ? CommandResult.empty : validation;
    }
}

/** The new PasswordField, ToggleSwitchField, and RatingField bound to a command. */
export const Overview: Story = {
    render: () => (
        <div style={{ width: '420px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <CommandForm<ProfileCommand> command={ProfileCommand} autoServerValidate={false} validateOn="change">
                <div>
                    <label>Password</label>
                    <PasswordField<ProfileCommand> value={c => c.password} placeholder="At least 6 characters" />
                </div>
                <div>
                    <ToggleSwitchField<ProfileCommand> value={c => c.notifications} label="Enable notifications" />
                </div>
                <div>
                    <label>Rating</label>
                    <RatingField<ProfileCommand> value={c => c.rating} stars={5} />
                </div>
            </CommandForm>
        </div>
    ),
};
