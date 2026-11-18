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
import type { SwitchProps } from '../../Common/Switch';
import { joinClassNames, userChange, type ChoiceState } from './fieldSlotHelpers';
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

/** Props shared by the `ToggleSwitchField` part components. */
interface SwitchPartProps<T> {
    parts?: T;
    state: ChoiceState;
}

/** Native input of the `ToggleSwitchField`. */
const SwitchInput = ({
    parts,
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    checked,
    onChange,
    state,
}: SwitchPartProps<InputHTMLAttributes<HTMLInputElement>> &
    Pick<SwitchProps, 'checked' | 'onChange' | 'id' | 'aria-label' | 'aria-describedby'>) => (
    <input
        {...parts}
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        type='checkbox'
        role='switch'
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

/** Outer decorative control of the `ToggleSwitchField`. */
const SwitchControl = ({
    parts,
    state,
    children,
}: SwitchPartProps<HTMLAttributes<HTMLSpanElement>> & { children: ReactNode }) => (
    <span
        {...parts}
        className={joinClassNames('cratis-switch__control', parts?.className)}
        data-cratis-part='control'
        data-disabled={state.disabled || undefined}
        data-invalid={state.invalid || undefined}
        data-selected={state.selected || undefined}
        aria-hidden='true'
    >
        {children}
    </span>
);

/** Inner decorative handle of the `ToggleSwitchField`. */
const SwitchHandle = ({
    parts,
    state,
    children,
}: SwitchPartProps<HTMLAttributes<HTMLSpanElement>> & { children?: ReactNode }) => (
    <span
        {...parts}
        className={joinClassNames('cratis-switch__handle', parts?.className)}
        data-cratis-part='handle'
        data-disabled={state.disabled || undefined}
        data-invalid={state.invalid || undefined}
        data-selected={state.selected || undefined}
    >
        {children}
    </span>
);

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
    const state: ChoiceState = { disabled: pt?.input?.disabled, invalid, selected: checked };
    return (
        <label
            {...pt?.root}
            className={joinClassNames('cratis-choice-field', pt?.root?.className, className)}
            onBlur={onBlur as FocusEventHandler<Element> | undefined}
            data-cratis-part='root'
            data-cratis-component='ToggleSwitchField'
            data-disabled={state.disabled || undefined}
            data-invalid={state.invalid || undefined}
            data-selected={state.selected || undefined}
        >
            <SwitchInput
                parts={pt?.input}
                id={id}
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedBy}
                checked={checked}
                onChange={onChange}
                state={state}
            />
            <SwitchControl parts={pt?.control} state={state}>
                <SwitchHandle parts={pt?.handle} state={state}></SwitchHandle>
            </SwitchControl>
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
