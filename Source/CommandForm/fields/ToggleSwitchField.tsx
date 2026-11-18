// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { FocusEventHandler, HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import { unstable_useSlot } from '../../renderer/RendererContext';
import { renderSlot } from '../../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../../renderer/slots';
import type { SwitchProps } from '../../Common/Switch';
import { joinClassNames, userChange } from './fieldSlotHelpers';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import type { ExactPartKeys } from '../../types/ExactPartKeys';
import type { PartsOf } from '../../types/parts';

/** Stable part attributes for {@link ToggleSwitchField}. */
export interface ToggleSwitchParts {
    /** Wrapping label. */
    root?: HTMLAttributes<HTMLLabelElement>;
    /** Native checkbox with switch semantics. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual switch track. */
    control?: HTMLAttributes<HTMLSpanElement>;
    /** Visual switch handle. */
    handle?: HTMLAttributes<HTMLSpanElement>;
}

const toggleSwitchPartsMatchManifest: ExactPartKeys<ToggleSwitchParts, PartsOf<'ToggleSwitchField'>> = true;
void toggleSwitchPartsMatchManifest;

interface ToggleSwitchFieldComponentProps
    extends WrappedFieldProps<boolean>,
        FieldAccessibilityProps {
    label?: string;
    className?: string;
    pt?: ToggleSwitchParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** Core `ToggleSwitchField` markup, used when no adapter supplies `common.switch`. */
const ToggleSwitchFieldCore = ({
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
}: SwitchProps) => {
    return (
        <label
            {...pt?.root}
            className={joinClassNames('cratis-choice-field', pt?.root?.className, className)}
            onBlur={onBlur as FocusEventHandler<Element> | undefined}
            data-cratis-part='root'
            data-cratis-component='ToggleSwitchField'
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
                role='switch'
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
                {...pt?.control}
                className={joinClassNames('cratis-switch__control', pt?.control?.className)}
                data-cratis-part='control'
                data-disabled={pt?.input?.disabled || undefined}
                data-invalid={invalid || undefined}
                data-selected={checked || undefined}
                aria-hidden='true'
            >
                <span
                    {...pt?.handle}
                    className={joinClassNames('cratis-switch__handle', pt?.handle?.className)}
                    data-cratis-part='handle'
                    data-disabled={pt?.input?.disabled || undefined}
                    data-invalid={invalid || undefined}
                    data-selected={checked || undefined}
                ></span>
            </span>
            {label && <span className='cratis-choice-field__label'>{label}</span>}
        </label>
    );
};

/** Frozen Core declaration resolved when no active renderer supplies `common.switch`. */
const coreSwitchDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: ToggleSwitchFieldCore,
}) satisfies unstable_SlotDeclaration<'common.switch'>;


/** An on/off switch bound to a boolean property on an Arc command. */
export const ToggleSwitchField = asCommandFormField<ToggleSwitchFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'] ?? props.label,
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });
        const declaration = unstable_useSlot('common.switch', coreSwitchDeclaration);
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
