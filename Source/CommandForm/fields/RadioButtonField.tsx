// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { FocusEventHandler, HTMLAttributes, InputHTMLAttributes } from 'react';
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
    return (
        <label
            {...pt?.root}
            className={joinClassNames('cratis-choice-field', pt?.root?.className, className)}
            onBlur={onBlur as FocusEventHandler<Element> | undefined}
            data-cratis-part='root'
            data-cratis-component='RadioButtonField'
            data-disabled={pt?.input?.disabled || undefined}
            data-invalid={invalid || undefined}
            data-selected={checked || undefined}
        >
            <input
                {...pt?.input}
                id={id}
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedBy}
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
