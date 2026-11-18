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
import type { CheckboxProps } from '../../Common/Checkbox';
import { joinClassNames, userChange, type ChoiceState } from './fieldSlotHelpers';
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

/** Props shared by the `CheckboxField` part components. */
interface CheckboxPartProps<T> {
    parts?: T;
    state: ChoiceState;
}

/** Native input of the `CheckboxField`. */
const CheckboxInput = ({
    parts,
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    checked,
    onChange,
    state,
}: CheckboxPartProps<InputHTMLAttributes<HTMLInputElement>> &
    Pick<CheckboxProps, 'checked' | 'onChange' | 'id' | 'aria-label' | 'aria-describedby'>) => (
    <input
        {...parts}
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        type='checkbox'
        checked={checked}
        onChange={(event) => onChange?.(event.currentTarget.checked, userChange(event))}
        aria-invalid={state.invalid || undefined}
        className={joinClassNames('cratis-choice-field__native', parts?.className)}
        data-cratis-part='input'
        data-disabled={state.disabled || undefined}
        data-invalid={state.invalid || undefined}
        data-selected={state.selected || undefined}
    />
);

/** Outer decorative box of the `CheckboxField`. */
const CheckboxBox = ({
    parts,
    state,
    children,
}: CheckboxPartProps<HTMLAttributes<HTMLSpanElement>> & { children: ReactNode }) => (
    <span
        {...parts}
        className={joinClassNames('cratis-checkbox__box', parts?.className)}
        data-cratis-part='box'
        data-disabled={state.disabled || undefined}
        data-invalid={state.invalid || undefined}
        data-selected={state.selected || undefined}
        aria-hidden='true'
    >
        {children}
    </span>
);

/** Inner decorative indicator of the `CheckboxField`. */
const CheckboxIndicator = ({
    parts,
    state,
    children,
}: CheckboxPartProps<HTMLAttributes<HTMLSpanElement>> & { children?: ReactNode }) => (
    <span
        {...parts}
        className={joinClassNames('cratis-checkbox__indicator', parts?.className)}
        data-cratis-part='indicator'
        data-disabled={state.disabled || undefined}
        data-invalid={state.invalid || undefined}
        data-selected={state.selected || undefined}
    >
        {children}
    </span>
);

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
    const state: ChoiceState = { disabled: pt?.input?.disabled, invalid, selected: checked };
    return (
        <label
            {...pt?.root}
            className={joinClassNames('cratis-choice-field', pt?.root?.className, className)}
            onBlur={onBlur as FocusEventHandler<Element> | undefined}
            data-cratis-part='root'
            data-cratis-component='CheckboxField'
            data-disabled={state.disabled || undefined}
            data-invalid={state.invalid || undefined}
            data-selected={state.selected || undefined}
        >
            <CheckboxInput
                parts={pt?.input}
                id={id}
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedBy}
                checked={checked}
                onChange={onChange}
                state={state}
            />
            <CheckboxBox parts={pt?.box} state={state}>
                <CheckboxIndicator parts={pt?.indicator} state={state}>
                    ✓
                </CheckboxIndicator>
            </CheckboxBox>
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
