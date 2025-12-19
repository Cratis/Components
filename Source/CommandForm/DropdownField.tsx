import { PropertyAccessor } from '@cratis/fundamentals';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import React, { useState, useEffect } from 'react';
import { DropdownChangeEvent } from 'primereact/dropdown';
import { Dropdown } from '../Dropdown';
import { useCommandFormContext } from './CommandForm';

export interface DropdownFieldProps<TCommand, TOption> {
    icon?: React.ReactElement;
    value: PropertyAccessor<TCommand>;
    options: TOption[];
    optionIdField: keyof TOption;
    optionLabelField: keyof TOption;
    placeholder?: string;
    onChange?: (value: any) => void;
    currentValue?: any;
    onValueChange?: (value: any) => void;
    required?: boolean;
    title?: string;
    description?: string;
    propertyDescriptor?: PropertyDescriptor;
    fieldName?: string;
}

export const DropdownField = <TCommand, TOption>(props: DropdownFieldProps<TCommand, TOption>) => {
    const [localValue, setLocalValue] = useState(props.currentValue);
    const required = props.required ?? true;
    const isValid = !required || localValue !== null && localValue !== undefined;
    const { setFieldValidity } = useCommandFormContext();

    useEffect(() => {
        setLocalValue(props.currentValue);
    }, [props.currentValue]);

    useEffect(() => {
        if (props.fieldName) {
            setFieldValidity(props.fieldName, isValid);
        }
    }, [isValid, props.fieldName, setFieldValidity]);

    const handleChange = (e: DropdownChangeEvent) => {
        const newValue = e.value;
        setLocalValue(newValue);
        props.onValueChange?.(newValue);
    };

    return (
        <Dropdown
            value={localValue}
            onChange={handleChange}
            options={props.options}
            optionLabel={props.optionLabelField as string}
            optionValue={props.optionIdField as string}
            placeholder={props.placeholder || props.title}
            required={required}
            invalid={!isValid}
            className="w-full"
        />
    );
};

DropdownField.displayName = 'CommandFormField';
