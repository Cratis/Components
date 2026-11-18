// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    Fragment,
    useId,
    type FocusEventHandler,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
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

/** Stable part attributes for {@link RadioGroupField}. */
export interface RadioGroupParts {
    /** Semantic radiogroup wrapper. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** One option label. */
    option?: HTMLAttributes<HTMLLabelElement>;
    /** Native radio input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual radio box. */
    box?: HTMLAttributes<HTMLSpanElement>;
    /** Visual selected indicator. */
    indicator?: HTMLAttributes<HTMLSpanElement>;
}

const radioGroupPartsMatchManifest: ExactPartKeys<RadioGroupParts, PartsOf<'RadioGroupField'>> = true;
void radioGroupPartsMatchManifest;

interface RadioGroupFieldComponentProps
    extends WrappedFieldProps<string | number>,
        FieldAccessibilityProps {
    options: Array<Record<string, unknown>>;
    optionLabel: string;
    optionValue: string;
    layout?: 'horizontal' | 'vertical';
    /** Native radio-group name. Generated automatically when omitted. */
    name?: string;
    className?: string;
    pt?: RadioGroupParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** Props shared by the `RadioGroupField` option part components. */
interface RadioOptionPartProps<T> {
    parts?: T;
    state: ChoiceState;
}

/** Native input of the `RadioGroupField` option. */
const RadioOptionInput = ({
    parts,
    name,
    checked,
    onChange,
    state,
}: RadioOptionPartProps<InputHTMLAttributes<HTMLInputElement>> &
    Pick<RadioProps, 'checked' | 'onChange' | 'name'>) => (
    <input
        {...parts}
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

/** Outer decorative box of the `RadioGroupField` option. */
const RadioOptionBox = ({
    parts,
    state,
    children,
}: RadioOptionPartProps<HTMLAttributes<HTMLSpanElement>> & { children: ReactNode }) => (
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

/** Inner decorative indicator of the `RadioGroupField` option. */
const RadioOptionIndicator = ({
    parts,
    state,
    children,
}: RadioOptionPartProps<HTMLAttributes<HTMLSpanElement>> & { children?: ReactNode }) => (
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

/** Core `RadioGroupField` option markup, used when no adapter supplies `common.radio`. */
const RadioOptionCore = ({
    name,
    label,
    checked,
    onChange,
    onBlur,
    invalid,
    pt,
}: RadioProps) => {
    const state: ChoiceState = { disabled: pt?.input?.disabled, invalid, selected: checked };
    return (
        <label
            {...pt?.root}
            className={joinClassNames('cratis-choice-field', pt?.root?.className)}
            onBlur={onBlur as FocusEventHandler<Element> | undefined}
            data-cratis-part='option'
            data-disabled={state.disabled || undefined}
            data-invalid={state.invalid || undefined}
            data-selected={state.selected || undefined}
        >
            <RadioOptionInput
                parts={pt?.input}
                name={name}
                checked={checked}
                onChange={onChange}
                state={state}
            />
            <RadioOptionBox parts={pt?.box} state={state}>
                <RadioOptionIndicator parts={pt?.indicator} state={state}></RadioOptionIndicator>
            </RadioOptionBox>
            <span className='cratis-choice-field__label'>{label}</span>
        </label>
    );
};

/** Frozen Core declaration resolved when no active renderer supplies `common.radio`. */
const coreRadioOptionDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: RadioOptionCore,
}) satisfies unstable_SlotDeclaration<'common.radio'>;


/** A visible radio group bound to a string or number property on an Arc command. */
export const RadioGroupField = asCommandFormField<RadioGroupFieldComponentProps>(
    (props) => {
        const generatedName = useId();
        const name = props.name ?? generatedName;
        const declaration = unstable_useSlot('common.radio', coreRadioOptionDeclaration);
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.root?.id,
            ariaLabel: props.pt?.root?.['aria-label'],
            ariaDescribedBy: props.pt?.root?.['aria-describedby'],
        });

        return (
            <div
                {...props.pt?.root}
                id={accessibility.controlId}
                role='radiogroup'
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                aria-invalid={props.invalid || undefined}
                className={joinClassNames(
                    'cratis-radio-group',
                    `cratis-radio-group--${props.layout ?? 'vertical'}`,
                    props.pt?.root?.className,
                    props.className,
                )}
                data-cratis-part='root'
                data-cratis-component='RadioGroupField'
                data-disabled={props.pt?.input?.disabled || undefined}
                data-invalid={props.invalid || undefined}
            >
                {props.options.map((option) => {
                    const value = option[props.optionValue] as string | number;
                    return (
                        <Fragment key={String(value)}>
                            {renderSlot(declaration, {
                                name,
                                value,
                                label: String(option[props.optionLabel] ?? value),
                                checked: props.value === value,
                                onChange: (checked) => checked && props.onChange(value),
                                onBlur: props.onBlur,
                                invalid: props.invalid,
                                'aria-invalid': props.invalid || undefined,
                                pt: {
                                    root: props.pt?.option,
                                    input: props.pt?.input,
                                    box: props.pt?.box,
                                    indicator: props.pt?.indicator,
                                },
                            })}
                        </Fragment>
                    );
                })}
                {accessibility.hiddenError}
            </div>
        );
    },
    { defaultValue: '' },
);
