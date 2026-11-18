// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import { unstable_useSlot } from '../../renderer/RendererContext';
import { renderSlot } from '../../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../../renderer/slots';
import type { TextInputProps, TextInputType } from '../../Common/TextInput';
import { joinClassNames, userChange } from './fieldSlotHelpers';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';

/** Stable part attributes for {@link InputTextField}. */
export interface InputTextParts {
    /** Native input element. */
    root?: InputHTMLAttributes<HTMLInputElement>;
}

interface InputTextComponentProps
    extends WrappedFieldProps<string>,
        FieldAccessibilityProps {
    type?:
        | 'text'
        | 'email'
        | 'password'
        | 'color'
        | 'date'
        | 'datetime-local'
        | 'time'
        | 'url'
        | 'tel'
        | 'search';
    placeholder?: string;
    className?: string;
    pt?: InputTextParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** Input types of {@link InputTextField} that `common.textInput` can present. */
const slotTextInputTypes: ReadonlyArray<string> = ['text', 'email', 'password', 'search', 'tel', 'url'];

/** Whether an input type is covered by the `common.textInput` slot contract. */
const isSlotTextInputType = (type: string | undefined): type is TextInputType | undefined =>
    type === undefined || slotTextInputTypes.includes(type);

/** Slot props widened to every native type so non-slot types keep the built-in markup. */
type TextInputCoreProps = Omit<TextInputProps, 'type'> & {
    type?: InputHTMLAttributes<HTMLInputElement>['type'];
};

/** Core InputTextField markup, used when no adapter supplies `common.textInput`. */
const InputTextFieldCore = ({
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    value,
    onChange,
    onBlur,
    placeholder,
    type = 'text',
    invalid,
    className,
    pt,
}: TextInputCoreProps) => (
    <input
        {...pt?.root}
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.currentTarget.value, userChange(event))}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        data-disabled={pt?.root?.disabled || undefined}
        data-invalid={invalid || undefined}
        data-readonly={pt?.root?.readOnly || undefined}
        data-cratis-component='InputTextField'
        data-cratis-part='input'
        className={joinClassNames('cratis-field-input', 'cratis:w-full', pt?.root?.className, className)}
    />
);

/** Frozen Core declaration resolved when no active renderer supplies `common.textInput`. */
const coreTextInputDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: InputTextFieldCore,
}) satisfies unstable_SlotDeclaration<'common.textInput'>;


/** Resolves `common.textInput` and renders it; only mounted for types the slot covers. */
const SlotTextInput = (props: TextInputProps) =>
    renderSlot(unstable_useSlot('common.textInput', coreTextInputDeclaration), props);

/** A single-line text field bound to a string property on an Arc command. */
export const InputTextField = asCommandFormField<InputTextComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.root?.id,
            ariaLabel: props.pt?.root?.['aria-label'],
            ariaDescribedBy: props.pt?.root?.['aria-describedby'],
        });
        const slotProps = {
            id: accessibility.controlId,
            'aria-label': accessibility.ariaLabel,
            'aria-describedby': accessibility.ariaDescribedBy,
            value: props.value,
            onChange: (value: string) => props.onChange(value),
            onBlur: props.onBlur,
            placeholder: props.placeholder,
            invalid: props.invalid,
            'aria-invalid': props.invalid || undefined,
            className: props.className,
            pt: props.pt,
        };
        // Types the slot contract does not cover (color, date, ...) keep the built-in markup and
        // never resolve the slot, so a strict renderer without textInput cannot reject them.
        const control = isSlotTextInputType(props.type)
            ? <SlotTextInput {...slotProps} type={props.type} />
            : <InputTextFieldCore {...slotProps} type={props.type} />;
        return (
            <>
                {control}
                {accessibility.hiddenError}
            </>
        );
    },
    { defaultValue: '' },
);
