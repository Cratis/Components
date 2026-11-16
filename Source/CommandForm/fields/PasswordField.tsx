// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    useState,
    type ButtonHTMLAttributes,
    type HTMLAttributes,
    type InputHTMLAttributes,
} from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import { PasswordInput } from './PasswordInput';
import { PasswordRoot } from './PasswordRoot';
import { PasswordToggle } from './PasswordToggle';
import type { ExactPartKeys } from '../../types/ExactPartKeys';
import type { PartsOf } from '../../types/parts';

/** Stable part attributes for {@link PasswordField}. */
export interface PasswordParts {
    /** Field wrapper. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Native password/text input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visibility toggle button. */
    toggle?: ButtonHTMLAttributes<HTMLButtonElement>;
}

const passwordPartsMatchManifest: ExactPartKeys<PasswordParts, PartsOf<'PasswordField'>> = true;
void passwordPartsMatchManifest;

interface PasswordFieldComponentProps
    extends WrappedFieldProps<string>,
        FieldAccessibilityProps {
    placeholder?: string;
    className?: string;
    pt?: PasswordParts;
    ptOptions?: object;
    unstyled?: boolean;
    showLabel?: string;
    hideLabel?: string;
}

const PasswordControl = (props: PasswordFieldComponentProps) => {
    const [visible, setVisible] = useState(false);
    const accessibility = useFieldAccessibility(props, {
        id: props.pt?.input?.id,
        ariaLabel: props.pt?.input?.['aria-label'],
        ariaDescribedBy: props.pt?.input?.['aria-describedby'],
    });
    return (
        <PasswordRoot
            attributes={props.pt?.root}
            input={props.pt?.input}
            className={props.className}
            invalid={props.invalid}
            onBlur={props.onBlur}
        >
            <PasswordInput
                attributes={props.pt?.input}
                id={accessibility.controlId}
                ariaLabel={accessibility.ariaLabel}
                ariaDescribedBy={accessibility.ariaDescribedBy}
                visible={visible}
                value={props.value}
                onChange={props.onChange}
                placeholder={props.placeholder}
                invalid={props.invalid}
            />
            <PasswordToggle
                attributes={props.pt?.toggle}
                visible={visible}
                showLabel={props.showLabel}
                hideLabel={props.hideLabel}
                onToggle={() => setVisible((current) => !current)}
            />
            {accessibility.hiddenError}
        </PasswordRoot>
    );
};

/** A masked password field bound to a string property on an Arc command. */
export const PasswordField = asCommandFormField<PasswordFieldComponentProps>(
    PasswordControl,
    { defaultValue: '' },
);
