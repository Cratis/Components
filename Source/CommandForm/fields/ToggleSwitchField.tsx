// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ToggleSwitch } from 'primereact/toggleswitch';
import type { ToggleSwitchRootProps, ToggleSwitchRootChangeEvent } from '@primereact/types/primitive/toggleswitch';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

/** Component-level props for {@link ToggleSwitchField}. */
interface ToggleSwitchFieldComponentProps extends WrappedFieldProps<boolean> {
    /** Optional label displayed next to the switch. */
    label?: string;
    /** Extra CSS class name forwarded to the underlying ToggleSwitch. */
    className?: string;
    /** PrimeReact pass-through configuration applied to the underlying ToggleSwitch. */
    pt?: ToggleSwitchRootProps['pt'];
    /** PrimeReact pass-through options applied to the underlying ToggleSwitch. */
    ptOptions?: ToggleSwitchRootProps['ptOptions'];
    /** When true, disables every base PrimeReact style on the underlying ToggleSwitch. */
    unstyled?: boolean;
}

/**
 * A boolean on/off switch field bound to a `boolean` property on a Cratis Arc
 * command — the toggle counterpart of {@link CheckboxField}. See
 * {@link InputTextField} for the full `value={c => c.prop}` binding model.
 *
 * ```tsx
 * <ToggleSwitchField value={c => c.notificationsEnabled} label="Notifications" />
 * ```
 */
export const ToggleSwitchField = asCommandFormField<ToggleSwitchFieldComponentProps>(
    (props) => (
        // A real <label> wrapping the switch: the underlying checkbox input is a
        // descendant, so the visible text becomes its accessible name (implicit
        // association) regardless of the composition's internal structure — and
        // the text doubles the click target.
        <label className="flex items-center" onBlur={props.onBlur}>
            <ToggleSwitch.Root
                checked={props.value}
                onCheckedChange={props.onChange}
                invalid={props.invalid}
                className={props.className}
                pt={props.pt}
                ptOptions={props.ptOptions}
                unstyled={props.unstyled}>
                <ToggleSwitch.Control>
                    <ToggleSwitch.Handle />
                </ToggleSwitch.Control>
            </ToggleSwitch.Root>
            {props.label && <span className="ml-2">{props.label}</span>}
        </label>
    ),
    {
        defaultValue: false,
        extractValue: (e: ToggleSwitchRootChangeEvent) => e.checked
    }
);
