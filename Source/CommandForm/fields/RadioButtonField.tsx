// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    FocusEventHandler,
    HTMLAttributes,
    InputHTMLAttributes,
    ReactNode,
} from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import { unstable_useSlot } from '../../renderer/RendererContext';
import { renderSlot } from '../../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../../renderer/slots';
import type { RadioProps } from '../../Common/Radio';
import { joinClassNames, userChange, type ChoiceState } from './fieldSlotHelpers';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import type { ExactPartKeys } from '../../types/ExactPartKeys';
import type { PartsOf } from '../../types/parts';

/** Stable part attributes for {@link RadioButtonField}. */
export interface RadioParts {
    /** Wrapping option label. */
    root?: HTMLAttributes<HTMLLabelElement>;
    /** Native radio input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual radio box. */
    box?: HTMLAttributes<HTMLSpanElement>;
    /** Visual selected indicator. */
    indicator?: HTMLAttributes<HTMLSpanElement>;
}

const radioPartsMatchManifest: ExactPartKeys<RadioParts, PartsOf<'RadioButtonField'>> = true;
void radioPartsMatchManifest;

interface RadioButtonFieldComponentProps
    extends WrappedFieldProps<string | number>,
        FieldAccessibilityProps {
    label?: string;
    buttonValue: string | number;
    /** Native group name shared by every option bound to the same property. */
    name: string;
    className?: string;
    pt?: RadioParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** Props shared by the `RadioButtonField` part components. */
interface RadioButtonPartProps<T> {
    parts?: T;
    state: ChoiceState;
}

/** Native input of the `RadioButtonField`. */
const RadioButtonInput = ({
    parts,
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    name,
    checked,
    onChange,
    state,
}: RadioButtonPartProps<InputHTMLAttributes<HTMLInputElement>> &
    Pick<RadioProps, 'checked' | 'onChange' | 'id' | 'aria-label' | 'aria-describedby' | 'name'>) => (
    <input
        {...parts}
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        type='radio'
        name={name}
        checked={checked}
        onChange={(event) => event.currentTarget.checked && onChange?.(true, userChange(event))}
        aria-invalid={state.invalid || undefined}
        className={joinClassNames('cratis-choice-field__native', parts?.className)}
        data-cratis-part='input'
        data-disabled={state.disabled || undefined}
        data-invalid={state.invalid || undefined}
        data-selected={state.selected || undefined}
    />
);

/** Outer decorative box of the `RadioButtonField`. */
const RadioButtonBox = ({
    parts,
    state,
    children,
}: RadioButtonPartProps<HTMLAttributes<HTMLSpanElement>> & { children: ReactNode }) => (
    <span
        {...parts}
        className={joinClassNames('cratis-radio__box', parts?.className)}
        data-cratis-part='box'
        data-disabled={state.disabled || undefined}
        data-invalid={state.invalid || undefined}
        data-selected={state.selected || undefined}
        aria-hidden='true'
    >
        {children}
    </span>
);

/** Inner decorative indicator of the `RadioButtonField`. */
const RadioButtonIndicator = ({
    parts,
    state,
    children,
}: RadioButtonPartProps<HTMLAttributes<HTMLSpanElement>> & { children?: ReactNode }) => (
    <span
        {...parts}
        className={joinClassNames('cratis-radio__indicator', parts?.className)}
        data-cratis-part='indicator'
        data-disabled={state.disabled || undefined}
        data-invalid={state.invalid || undefined}
        data-selected={state.selected || undefined}
    >
        {children}
    </span>
);

/** Core `RadioButtonField` markup, used when no adapter supplies `common.radio`. */
const RadioButtonFieldCore = ({
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    name,
    label,
    checked,
    onChange,
    onBlur,
    invalid,
    className,
    pt,
}: RadioProps) => {
    const state: ChoiceState = { disabled: pt?.input?.disabled, invalid, selected: checked };
    return (
        <label
            {...pt?.root}
            className={joinClassNames('cratis-choice-field', pt?.root?.className, className)}
            onBlur={onBlur as FocusEventHandler<Element> | undefined}
            data-cratis-part='root'
            data-cratis-component='RadioButtonField'
            data-disabled={state.disabled || undefined}
            data-invalid={state.invalid || undefined}
            data-selected={state.selected || undefined}
        >
            <RadioButtonInput
                parts={pt?.input}
                id={id}
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedBy}
                name={name}
                checked={checked}
                onChange={onChange}
                state={state}
            />
            <RadioButtonBox parts={pt?.box} state={state}>
                <RadioButtonIndicator parts={pt?.indicator} state={state}></RadioButtonIndicator>
            </RadioButtonBox>
            {label && <span className='cratis-choice-field__label'>{label}</span>}
        </label>
    );
};

/** Frozen Core declaration resolved when no active renderer supplies `common.radio`. */
const coreRadioButtonDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: RadioButtonFieldCore,
}) satisfies unstable_SlotDeclaration<'common.radio'>;


/** A single radio option bound to a string or number property on an Arc command. */
export const RadioButtonField = asCommandFormField<RadioButtonFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'] ?? props.label,
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });
        const selected = props.value === props.buttonValue;
        const declaration = unstable_useSlot('common.radio', coreRadioButtonDeclaration);
        return (
            <>
                {renderSlot(declaration, {
                    id: accessibility.controlId,
                    'aria-label': accessibility.ariaLabel,
                    'aria-describedby': accessibility.ariaDescribedBy,
                    name: props.name,
                    value: props.buttonValue,
                    label: props.label,
                    checked: selected,
                    onChange: (checked) => checked && props.onChange(props.buttonValue),
                    onBlur: props.onBlur,
                    invalid: props.invalid,
                    'aria-invalid': props.invalid || undefined,
                    className: props.className,
                    pt: props.pt,
                })}
                {accessibility.hiddenError}
            </>
        );
    },
    { defaultValue: '' },
);
