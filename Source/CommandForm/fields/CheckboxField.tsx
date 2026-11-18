// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { FocusEventHandler, HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import { unstable_useSlot } from '../../renderer/RendererContext';
import { renderSlot } from '../../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../../renderer/slots';
import type { CheckboxProps } from '../../Common/Checkbox';
import { joinClassNames, userChange } from './fieldSlotHelpers';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import type { ExactPartKeys } from '../../types/ExactPartKeys';
import type { PartsOf } from '../../types/parts';

/** Stable part attributes for {@link CheckboxField}. */
export interface CheckboxParts {
    /** Wrapping label. */
    root?: HTMLAttributes<HTMLLabelElement>;
    /** Native checkbox input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual checkbox box. */
    box?: HTMLAttributes<HTMLSpanElement>;
    /** Visual checked indicator. */
    indicator?: HTMLAttributes<HTMLSpanElement>;
}

const checkboxPartsMatchManifest: ExactPartKeys<CheckboxParts, PartsOf<'CheckboxField'>> = true;
void checkboxPartsMatchManifest;

interface CheckboxFieldComponentProps
    extends WrappedFieldProps<boolean>,
        FieldAccessibilityProps {
    label?: string;
    className?: string;
    pt?: CheckboxParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** Core `CheckboxField` markup, used when no adapter supplies `common.checkbox`. */
const CheckboxFieldCore = ({
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    label,
    checked,
    onChange,
    onBlur,
    invalid,
    className,
    pt,
}: CheckboxProps) => {
    return (
        <label
            {...pt?.root}
            className={joinClassNames('cratis-choice-field', pt?.root?.className, className)}
            onBlur={onBlur as FocusEventHandler<Element> | undefined}
            data-cratis-part='root'
            data-cratis-component='CheckboxField'
            data-disabled={pt?.input?.disabled || undefined}
            data-invalid={invalid || undefined}
            data-selected={checked || undefined}
        >
            <input
                {...pt?.input}
                id={id}
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedBy}
                type='checkbox'
                checked={checked}
                onChange={(event) => onChange?.(event.currentTarget.checked, userChange(event))}
                aria-invalid={invalid || undefined}
                className={joinClassNames('cratis-choice-field__native', pt?.input?.className)}
                data-cratis-part='input'
                data-disabled={pt?.input?.disabled || undefined}
                data-invalid={invalid || undefined}
                data-selected={checked || undefined}
            />
            <span
                {...pt?.box}
                className={joinClassNames('cratis-checkbox__box', pt?.box?.className)}
                data-cratis-part='box'
                data-disabled={pt?.input?.disabled || undefined}
                data-invalid={invalid || undefined}
                data-selected={checked || undefined}
                aria-hidden='true'
            >
                <span
                    {...pt?.indicator}
                    className={joinClassNames('cratis-checkbox__indicator', pt?.indicator?.className)}
                    data-cratis-part='indicator'
                    data-disabled={pt?.input?.disabled || undefined}
                    data-invalid={invalid || undefined}
                    data-selected={checked || undefined}
                >
                    ✓
                </span>
            </span>
            {label && <span className='cratis-choice-field__label'>{label}</span>}
        </label>
    );
};

/** Frozen Core declaration resolved when no active renderer supplies `common.checkbox`. */
const coreCheckboxDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: CheckboxFieldCore,
}) satisfies unstable_SlotDeclaration<'common.checkbox'>;


/** A checkbox field bound to a boolean property on an Arc command. */
export const CheckboxField = asCommandFormField<CheckboxFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'] ?? props.label,
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });
        const declaration = unstable_useSlot('common.checkbox', coreCheckboxDeclaration);
        return (
            <>
                {renderSlot(declaration, {
                    id: accessibility.controlId,
                    'aria-label': accessibility.ariaLabel,
                    'aria-describedby': accessibility.ariaDescribedBy,
                    label: props.label,
                    checked: props.value,
                    onChange: (checked) => props.onChange(checked),
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
    { defaultValue: false },
);
