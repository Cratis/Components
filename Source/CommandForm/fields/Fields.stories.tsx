// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CommandForm } from '@cratis/arc.react/commands';
import { Command, CommandValidator } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { StoryContainer, StorySection, StoryDivider } from '@cratis/arc.react/stories';
import '@cratis/arc/validation';
import { Button } from '../../Common/Button';
import {
    InputTextField,
    NumberField,
    TextAreaField,
    CheckboxField,
    SliderField,
    DropdownField,
    CalendarField,
    ColorPickerField,
    MultiSelectField,
    ChipsField,
    RadioButtonField,
    RadioGroupField,
} from './index';

const meta: Meta = {
    title: 'CommandForm/Fields',
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj;

// Demo command for showcasing all fields
class FormFieldsCommand extends Command {
    readonly route: string = '/api/fields';
    readonly validation: FormFieldsCommandValidator = new FormFieldsCommandValidator();
    readonly propertyDescriptors: PropertyDescriptor[] = [
        new PropertyDescriptor('textInput', String),
        new PropertyDescriptor('emailInput', String),
        new PropertyDescriptor('passwordInput', String),
        new PropertyDescriptor('numberInput', Number),
        new PropertyDescriptor('textArea', String),
        new PropertyDescriptor('checkbox', Boolean),
        new PropertyDescriptor('slider', Number),
        new PropertyDescriptor('dropdown', String),
        new PropertyDescriptor('calendarDate', Date),
        new PropertyDescriptor('color', String),
        new PropertyDescriptor('multiSelect', Array),
        new PropertyDescriptor('chips', Array),
        new PropertyDescriptor('radioButton', String),
        new PropertyDescriptor('radioGroup', String),
    ];

    textInput = '';
    emailInput = '';
    passwordInput = '';
    numberInput = 0;
    textArea = '';
    checkbox = false;
    slider = 50;
    dropdown = '';
    calendarDate: Date | null = null;
    color = '';
    multiSelect: Array<string | number> = [];
    chips: string[] = [];
    radioButton = '';
    radioGroup = '';

    constructor() {
        super(Object, false);
    }

    get requestParameters(): string[] {
        return [];
    }

    get properties(): string[] {
        return [
            'textInput',
            'emailInput',
            'passwordInput',
            'numberInput',
            'textArea',
            'checkbox',
            'slider',
            'dropdown',
            'calendarDate',
            'color',
            'multiSelect',
            'chips',
            'radioButton',
            'radioGroup',
        ];
    }
}

class FormFieldsCommandValidator extends CommandValidator<FormFieldsCommand> {
    constructor() {
        super();
        this.ruleFor((c) => c.textInput)
            .notEmpty()
            .minLength(3);
        this.ruleFor((c) => c.emailInput)
            .notEmpty()
            .emailAddress();
        this.ruleFor((c) => c.passwordInput)
            .notEmpty()
            .minLength(6);
        this.ruleFor((c) => c.numberInput)
            .greaterThanOrEqual(1)
            .lessThanOrEqual(100);
        this.ruleFor((c) => c.dropdown).notEmpty();
    }
}

const dropdownOptions = [
    { id: 'option1', name: 'Option 1' },
    { id: 'option2', name: 'Option 2' },
    { id: 'option3', name: 'Option 3' },
    { id: 'option4', name: 'Option 4' },
];

const multiSelectOptions = [
    { id: 'feature1', name: 'Feature 1' },
    { id: 'feature2', name: 'Feature 2' },
    { id: 'feature3', name: 'Feature 3' },
    { id: 'feature4', name: 'Feature 4' },
];

export const AllFields: Story = {
    render: () => {
        const [validationState, setValidationState] = useState<{
            errors: Record<string, string>;
            canSubmit: boolean;
        }>({ errors: {}, canSubmit: false });

        return (
            <StoryContainer size='md' asCard>
                <h1>Cratis Command Form Fields</h1>
                <p>
                    This showcase demonstrates the Cratis-owned fields integrated with
                    CommandForm from @cratis/arc.react.
                </p>

                <StoryDivider />

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{
                        textInput: '',
                        emailInput: '',
                        passwordInput: '',
                        numberInput: 25,
                        textArea: '',
                        checkbox: false,
                        slider: 50,
                        dropdown: '',
                        calendarDate: null,
                        color: '10b981',
                        multiSelect: ['feature1', 'feature3'],
                        chips: ['alpha', 'beta'],
                        radioButton: '',
                        radioGroup: '',
                    }}
                    onFieldChange={async (command, fieldName) => {
                        // Validate on field change
                        const result = await command.validate();

                        if (!result.isValid) {
                            const fieldError = result.validationResults.find((v) =>
                                v.members.includes(fieldName),
                            );

                            if (fieldError) {
                                setValidationState((prev) => ({
                                    errors: {
                                        ...prev.errors,
                                        [fieldName]: fieldError.message,
                                    },
                                    canSubmit: false,
                                }));
                            }
                        } else {
                            setValidationState((prev) => {
                                const { [fieldName]: _removed, ...rest } = prev.errors;
                                return {
                                    errors: rest,
                                    canSubmit: Object.keys(rest).length === 0,
                                };
                            });
                        }
                    }}
                >
                    <StorySection>
                        <h2>Text Inputs</h2>

                        <InputTextField<FormFieldsCommand>
                            value={(c) => c.textInput}
                            title='Text Input'
                            placeholder='Enter at least 3 characters'
                            description='Standard text input field with validation'
                        />
                        {validationState.errors.textInput && (
                            <div
                                style={{
                                    color: 'var(--cratis-red-500)',
                                    fontSize: '0.875rem',
                                    marginTop: '0.25rem',
                                    marginBottom: '1rem',
                                }}
                            >
                                {validationState.errors.textInput}
                            </div>
                        )}

                        <InputTextField<FormFieldsCommand>
                            value={(c) => c.emailInput}
                            title='Email Input'
                            type='email'
                            placeholder='Enter a valid email address'
                            description='Email input with email validation'
                        />
                        {validationState.errors.emailInput && (
                            <div
                                style={{
                                    color: 'var(--cratis-red-500)',
                                    fontSize: '0.875rem',
                                    marginTop: '0.25rem',
                                    marginBottom: '1rem',
                                }}
                            >
                                {validationState.errors.emailInput}
                            </div>
                        )}

                        <InputTextField<FormFieldsCommand>
                            value={(c) => c.passwordInput}
                            title='Password Input'
                            type='password'
                            placeholder='Enter at least 6 characters'
                            description='Password input field (min 6 characters)'
                        />
                        {validationState.errors.passwordInput && (
                            <div
                                style={{
                                    color: 'var(--cratis-red-500)',
                                    fontSize: '0.875rem',
                                    marginTop: '0.25rem',
                                    marginBottom: '1rem',
                                }}
                            >
                                {validationState.errors.passwordInput}
                            </div>
                        )}
                    </StorySection>

                    <StoryDivider />

                    <StorySection>
                        <h2>Number Input</h2>

                        <NumberField<FormFieldsCommand>
                            value={(c) => c.numberInput}
                            title='Number Field'
                            placeholder='Enter a number (1-100)'
                            description='Number input with min/max boundaries'
                            min={1}
                            max={100}
                            step={1}
                        />
                        {validationState.errors.numberInput && (
                            <div
                                style={{
                                    color: 'var(--cratis-red-500)',
                                    fontSize: '0.875rem',
                                    marginTop: '0.25rem',
                                    marginBottom: '1rem',
                                }}
                            >
                                {validationState.errors.numberInput}
                            </div>
                        )}
                    </StorySection>

                    <StoryDivider />

                    <StorySection>
                        <h2>Text Area</h2>

                        <TextAreaField<FormFieldsCommand>
                            value={(c) => c.textArea}
                            title='Text Area Field'
                            placeholder='Enter a longer text...'
                            description='Multi-line text input'
                            rows={5}
                        />
                    </StorySection>

                    <StoryDivider />

                    <StorySection>
                        <h2>Dropdown</h2>

                        <DropdownField<FormFieldsCommand>
                            value={(c) => c.dropdown}
                            title='Dropdown Field'
                            placeholder='Select an option'
                            description='Accessible Cratis dropdown component'
                            options={dropdownOptions}
                            optionValue='id'
                            optionLabel='name'
                        />
                        {validationState.errors.dropdown && (
                            <div
                                style={{
                                    color: 'var(--cratis-red-500)',
                                    fontSize: '0.875rem',
                                    marginTop: '0.25rem',
                                    marginBottom: '1rem',
                                }}
                            >
                                {validationState.errors.dropdown}
                            </div>
                        )}
                    </StorySection>

                    <StoryDivider />

                    <StorySection>
                        <h2>Calendar</h2>

                        <CalendarField<FormFieldsCommand>
                            value={(c) => c.calendarDate}
                            title='Calendar Field'
                            description='Internationalized Cratis date picker'
                            placeholder='Select a date'
                            showIcon
                        />
                    </StorySection>

                    <StoryDivider />

                    <StorySection>
                        <h2>Color Picker</h2>

                        <ColorPickerField<FormFieldsCommand>
                            value={(c) => c.color}
                            title='Color Picker Field'
                            description='Cratis color picker for selecting hex colors'
                        />
                    </StorySection>

                    <StoryDivider />

                    <StorySection>
                        <h2>MultiSelect</h2>

                        <MultiSelectField<FormFieldsCommand>
                            value={(c) => c.multiSelect}
                            title='MultiSelect Field'
                            description='Filterable Cratis multi-select'
                            placeholder='Choose one or more features'
                            options={multiSelectOptions}
                            optionValue='id'
                            optionLabel='name'
                            filter
                            showClear
                        />
                    </StorySection>

                    <StoryDivider />

                    <StorySection>
                        <h2>Chips</h2>

                        <ChipsField<FormFieldsCommand>
                            value={(c) => c.chips}
                            title='Chips Field'
                            description='Cratis chips field for entering multiple text values'
                            placeholder='Add tags and press Enter'
                            separator=','
                        />
                    </StorySection>

                    <StoryDivider />

                    <StorySection>
                        <h2>Slider</h2>

                        <SliderField<FormFieldsCommand>
                            value={(c) => c.slider}
                            title='Slider Field'
                            description='Slider for numeric values'
                            min={0}
                            max={100}
                            step={5}
                        />
                    </StorySection>

                    <StoryDivider />

                    <StorySection>
                        <h2>Checkbox</h2>

                        <CheckboxField<FormFieldsCommand>
                            value={(c) => c.checkbox}
                            label='I agree to the terms and conditions'
                        />
                    </StorySection>

                    <StoryDivider />

                    <StorySection>
                        <h2>Radio Button</h2>

                        <RadioButtonField<FormFieldsCommand>
                            name='radio-button-options'
                            value={(c) => c.radioButton}
                            buttonValue='option1'
                            label='Option 1'
                        />
                        <RadioButtonField<FormFieldsCommand>
                            name='radio-button-options'
                            value={(c) => c.radioButton}
                            buttonValue='option2'
                            label='Option 2'
                        />
                        <RadioButtonField<FormFieldsCommand>
                            name='radio-button-options'
                            value={(c) => c.radioButton}
                            buttonValue='option3'
                            label='Option 3'
                        />
                    </StorySection>

                    <StoryDivider />

                    <StorySection>
                        <h2>Radio Group</h2>

                        <RadioGroupField<FormFieldsCommand>
                            value={(c) => c.radioGroup}
                            title='Radio Group Field'
                            description='Radio buttons from an options array'
                            options={dropdownOptions}
                            optionValue='id'
                            optionLabel='name'
                        />
                    </StorySection>

                    <StoryDivider />

                    <div
                        style={{
                            marginTop: '1.5rem',
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            type='submit'
                            disabled={!validationState.canSubmit}
                            label='Submit Form'
                        />
                        {!validationState.canSubmit &&
                            Object.keys(validationState.errors).length > 0 && (
                                <span
                                    style={{
                                        color: 'var(--cratis-orange-500)',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    Please fix validation errors
                                </span>
                            )}
                    </div>
                </CommandForm>
            </StoryContainer>
        );
    },
};

export const InputTextFieldExample: Story = {
    render: () => {
        return (
            <StoryContainer size='sm' asCard>
                <h2>InputTextField</h2>
                <p>Cratis text inputs wrapped for CommandForm.</p>

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{ textInput: '', emailInput: '', passwordInput: '' }}
                >
                    <InputTextField<FormFieldsCommand>
                        value={(c) => c.textInput}
                        title='Standard Text'
                        placeholder='Type here...'
                    />

                    <InputTextField<FormFieldsCommand>
                        value={(c) => c.emailInput}
                        title='Email'
                        type='email'
                        placeholder='sample.user@example.invalid'
                    />

                    <InputTextField<FormFieldsCommand>
                        value={(c) => c.passwordInput}
                        title='Password'
                        type='password'
                        placeholder='••••••••'
                    />
                </CommandForm>
            </StoryContainer>
        );
    },
};

export const NumberFieldExample: Story = {
    render: () => {
        return (
            <StoryContainer size='sm' asCard>
                <h2>NumberField</h2>
                <p>Cratis number input with native constraints.</p>

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{ numberInput: 42 }}
                >
                    <NumberField<FormFieldsCommand>
                        value={(c) => c.numberInput}
                        title='Quantity'
                        placeholder='Enter a number'
                        min={0}
                        max={100}
                        step={1}
                    />
                </CommandForm>
            </StoryContainer>
        );
    },
};

export const TextAreaFieldExample: Story = {
    render: () => {
        return (
            <StoryContainer size='sm' asCard>
                <h2>TextAreaField</h2>
                <p>Cratis textarea for multi-line text input.</p>

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{ textArea: '' }}
                >
                    <TextAreaField<FormFieldsCommand>
                        value={(c) => c.textArea}
                        title='Description'
                        placeholder='Enter a detailed description...'
                        rows={6}
                    />
                </CommandForm>
            </StoryContainer>
        );
    },
};

export const DropdownFieldExample: Story = {
    render: () => {
        return (
            <StoryContainer size='sm' asCard>
                <h2>DropdownField</h2>
                <p>Cratis Dropdown for selecting from a list of options.</p>

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{ dropdown: '' }}
                >
                    <DropdownField<FormFieldsCommand>
                        value={(c) => c.dropdown}
                        title='Select Option'
                        placeholder='Choose...'
                        options={dropdownOptions}
                        optionValue='id'
                        optionLabel='name'
                    />
                </CommandForm>
            </StoryContainer>
        );
    },
};

export const SliderFieldExample: Story = {
    render: () => {
        return (
            <StoryContainer size='sm' asCard>
                <h2>SliderField</h2>
                <p>Cratis Slider for selecting numeric values visually.</p>

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{ slider: 75 }}
                >
                    <SliderField<FormFieldsCommand>
                        value={(c) => c.slider}
                        title='Volume'
                        min={0}
                        max={100}
                        step={5}
                    />
                </CommandForm>
            </StoryContainer>
        );
    },
};

export const CheckboxFieldExample: Story = {
    render: () => {
        return (
            <StoryContainer size='sm' asCard>
                <h2>CheckboxField</h2>
                <p>Cratis Checkbox for boolean values.</p>

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{ checkbox: false }}
                >
                    <CheckboxField<FormFieldsCommand>
                        value={(c) => c.checkbox}
                        label='Enable notifications'
                    />

                    <CheckboxField<FormFieldsCommand>
                        value={(c) => c.checkbox}
                        label='I have read and agree to the terms'
                    />
                </CommandForm>
            </StoryContainer>
        );
    },
};

export const CalendarFieldExample: Story = {
    render: () => {
        return (
            <StoryContainer size='sm' asCard>
                <h2>CalendarField</h2>
                <p>Cratis internationalized date picker for selecting date values.</p>

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{ calendarDate: null }}
                >
                    <CalendarField<FormFieldsCommand>
                        value={(c) => c.calendarDate}
                        title='Start Date'
                        placeholder='Pick a date'
                        showIcon
                    />
                </CommandForm>
            </StoryContainer>
        );
    },
};

export const ColorPickerFieldExample: Story = {
    render: () => {
        return (
            <StoryContainer size='sm' asCard>
                <h2>ColorPickerField</h2>
                <p>Cratis ColorPicker for selecting hex colors.</p>

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{ color: '0ea5e9' }}
                >
                    <ColorPickerField<FormFieldsCommand>
                        value={(c) => c.color}
                        title='Brand Color'
                    />
                </CommandForm>
            </StoryContainer>
        );
    },
};

export const MultiSelectFieldExample: Story = {
    render: () => {
        return (
            <StoryContainer size='sm' asCard>
                <h2>MultiSelectField</h2>
                <p>Cratis filterable multi-select for selecting several options.</p>

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{ multiSelect: ['feature2'] }}
                >
                    <MultiSelectField<FormFieldsCommand>
                        value={(c) => c.multiSelect}
                        title='Features'
                        placeholder='Select features'
                        options={multiSelectOptions}
                        optionValue='id'
                        optionLabel='name'
                        filter
                    />
                </CommandForm>
            </StoryContainer>
        );
    },
};

export const ChipsFieldExample: Story = {
    render: () => {
        return (
            <StoryContainer size='sm' asCard>
                <h2>ChipsField</h2>
                <p>Cratis Chips field for entering and managing multiple text values.</p>

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{ chips: ['urgent'] }}
                >
                    <ChipsField<FormFieldsCommand>
                        value={(c) => c.chips}
                        title='Tags'
                        placeholder='Type a tag and press Enter'
                        addOnBlur
                    />
                </CommandForm>
            </StoryContainer>
        );
    },
};

export const RadioButtonFieldExample: Story = {
    render: () => {
        return (
            <StoryContainer size='sm' asCard>
                <h2>RadioButtonField</h2>
                <p>
                    Cratis native radio options form one keyboard-navigable group when
                    they share a name.
                </p>

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{ radioButton: 'apple' }}
                >
                    <RadioButtonField<FormFieldsCommand>
                        name='fruit'
                        value={(c) => c.radioButton}
                        buttonValue='apple'
                        label='Apple'
                    />
                    <RadioButtonField<FormFieldsCommand>
                        name='fruit'
                        value={(c) => c.radioButton}
                        buttonValue='banana'
                        label='Banana'
                    />
                    <RadioButtonField<FormFieldsCommand>
                        name='fruit'
                        value={(c) => c.radioButton}
                        buttonValue='cherry'
                        label='Cherry'
                    />
                </CommandForm>
            </StoryContainer>
        );
    },
};

export const RadioGroupFieldExample: Story = {
    render: () => {
        const options = [
            { id: 'small', name: 'Small' },
            { id: 'medium', name: 'Medium' },
            { id: 'large', name: 'Large' },
            { id: 'xl', name: 'Extra Large' },
        ];

        return (
            <StoryContainer size='sm' asCard>
                <h2>RadioGroupField</h2>
                <p>Cratis native radio group rendered from an options array.</p>

                <CommandForm<FormFieldsCommand>
                    command={FormFieldsCommand}
                    initialValues={{ radioGroup: 'medium' }}
                >
                    <RadioGroupField<FormFieldsCommand>
                        value={(c) => c.radioGroup}
                        title='T-Shirt Size'
                        description='Select your preferred size'
                        options={options}
                        optionValue='id'
                        optionLabel='name'
                    />

                    <RadioGroupField<FormFieldsCommand>
                        value={(c) => c.radioGroup}
                        title='T-Shirt Size (Horizontal)'
                        description='Same options laid out horizontally'
                        options={options}
                        optionValue='id'
                        optionLabel='name'
                        layout='horizontal'
                    />
                </CommandForm>
            </StoryContainer>
        );
    },
};
