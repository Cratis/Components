// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import { PropertyAccessor } from '@cratis/fundamentals';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { useCommandFormContext } from './CommandForm';

export interface DatePickerFieldProps<TCommand> {
    icon?: React.ReactElement;
    value: PropertyAccessor<TCommand>;
    onChange?: (value: unknown) => void;
    currentValue?: string;
    onValueChange?: (value: string) => void;
    required?: boolean;
    title?: string;
    description?: string;
    propertyDescriptor?: PropertyDescriptor;
    fieldName?: string;
}

export const DatePickerField = <TCommand,>(props: DatePickerFieldProps<TCommand>) => {
    const [localValue, setLocalValue] = useState(props.currentValue || '');
    const required = props.required ?? true;
    const isValid = !required || localValue.trim().length > 0;
    const { setFieldValidity } = useCommandFormContext();

    useEffect(() => {
        setLocalValue(props.currentValue || '');
    }, [props.currentValue]);

    useEffect(() => {
        if (props.fieldName) {
            setFieldValidity(props.fieldName, isValid);
        }
    }, [isValid, props.fieldName, setFieldValidity]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        props.onValueChange?.(newValue);
    };

    return (
        <InputText
            type="date"
            value={localValue}
            onChange={handleChange}
            required={required}
            invalid={!isValid}
            placeholder={props.title}
        />
    );
};

DatePickerField.displayName = 'CommandFormField';
