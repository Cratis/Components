// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    Fragment,
    useId,
    type FocusEventHandler,
    type HTMLAttributes,
    type InputHTMLAttributes,
} from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import { unstable_useSlot } from '../../renderer/RendererContext';
import { renderSlot } from '../../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../../renderer/slots';
import type { RadioProps } from '../../Common/Radio';
import { joinClassNames, userChange } from './fieldSlotHelpers';
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
    return (
        <label
            {...pt?.root}
            className={joinClassNames('cratis-choice-field', pt?.root?.className)}
            onBlur={onBlur as FocusEventHandler<Element> | undefined}
            data-cratis-part='option'
            data-disabled={pt?.input?.disabled || undefined}
            data-invalid={invalid || undefined}
            data-selected={checked || undefined}
        >
            <input
                {...pt?.input}
                type='radio'
                name={name}
                checked={checked}
                onChange={(event) => event.currentTarget.checked && onChange?.(true, userChange(event))}
                aria-invalid={invalid || undefined}
                className={joinClassNames('cratis-choice-field__native', pt?.input?.className)}
                data-cratis-part='input'
                data-disabled={pt?.input?.disabled || undefined}
                data-invalid={invalid || undefined}
                data-selected={checked || undefined}
            />
            <span
                {...pt?.box}
                className={joinClassNames('cratis-radio__box', pt?.box?.className)}
                data-cratis-part='box'
                data-disabled={pt?.input?.disabled || undefined}
                data-invalid={invalid || undefined}
                data-selected={checked || undefined}
                aria-hidden='true'
            >
                <span
                    {...pt?.indicator}
                    className={joinClassNames('cratis-radio__indicator', pt?.indicator?.className)}
                    data-cratis-part='indicator'
                    data-disabled={pt?.input?.disabled || undefined}
                    data-invalid={invalid || undefined}
                    data-selected={checked || undefined}
                ></span>
            </span>
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
