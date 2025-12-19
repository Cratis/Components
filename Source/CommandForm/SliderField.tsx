import { PropertyAccessor } from '@cratis/fundamentals';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import React, { useState, useEffect } from 'react';
import { Slider, SliderChangeEvent } from 'primereact/slider';
import { useCommandFormContext } from './CommandForm';

export interface SliderFieldProps<TCommand> {
    icon?: React.ReactElement;
    value: PropertyAccessor<TCommand>;
    onChange?: (value: any) => void;
    currentValue?: number;
    onValueChange?: (value: number) => void;
    required?: boolean;
    title?: string;
    description?: string;
    propertyDescriptor?: PropertyDescriptor;
    fieldName?: string;
    min?: number;
    max?: number;
    step?: number;
}

export const SliderField = <TCommand,>(props: SliderFieldProps<TCommand>) => {
    const [localValue, setLocalValue] = useState(props.currentValue ?? 0);
    const required = props.required ?? true;
    const min = props.min ?? 0;
    const max = props.max ?? 1;
    const step = props.step ?? 0.01;
    const isValid = !required || (localValue >= min && localValue <= max);
    const { setFieldValidity } = useCommandFormContext();

    useEffect(() => {
        setLocalValue(props.currentValue ?? 0);
    }, [props.currentValue]);

    useEffect(() => {
        if (props.fieldName) {
            setFieldValidity(props.fieldName, isValid);
        }
    }, [isValid, props.fieldName, setFieldValidity]);

    const handleChange = (e: SliderChangeEvent) => {
        const newValue = e.value as number;
        setLocalValue(newValue);
        props.onValueChange?.(newValue);
    };

    return (
        <div className="p-inputtext w-full flex align-items-center gap-3" style={{ display: 'flex', alignItems: 'center', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
            <Slider
                value={localValue}
                onChange={handleChange}
                min={min}
                max={max}
                step={step}
                className="flex-1 ml-2"
            />
            <span className="font-semibold" style={{ minWidth: '3rem', textAlign: 'right' }}>
                {localValue.toFixed(2)}
            </span>
        </div>
    );
};

SliderField.displayName = 'CommandFormField';
