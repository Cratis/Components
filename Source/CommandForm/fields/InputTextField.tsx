// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { InputText, type InputTextProps } from 'primereact/inputtext';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

/**
 * Component-level props for {@link InputTextField}. Combined at runtime with
 * the field-level props injected by `asCommandFormField` (`value`, `onChange`,
 * `onBlur`, `invalid`).
 */
interface InputTextComponentProps extends WrappedFieldProps<string> {
    /** HTML input type. Defaults to `'text'`. */
    type?: 'text' | 'email' | 'password' | 'color' | 'date' | 'datetime-local' | 'time' | 'url' | 'tel' | 'search';

    /** Placeholder text shown when the field is empty. */
    placeholder?: string;

    /** Extra CSS class name forwarded to the PrimeReact InputText. Combined with the default `w-full`. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying InputText. */
    pt?: InputTextProps['pt'];

    /** PrimeReact pass-through options applied to the underlying InputText. */
    ptOptions?: InputTextProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying InputText. */
    unstyled?: boolean;
}

/**
 * A single-line text field for use inside a Cratis Arc `CommandForm` (or any
 * of its dialog-hosted variants like {@link CommandDialog},
 * {@link StepperCommandDialog}, {@link CommandStepper}).
 *
 * ## How it binds to the command
 *
 * The `value` prop is an accessor function — `value={c => c.name}` — where
 * `c` is the typed command instance. The `asCommandFormField` HOC from
 * `@cratis/arc.react/commands` reads the accessor, subscribes the field to
 * that property on the form context, and threads validation state back to
 * the input. You never read or write the command instance directly; the
 * field handles it.
 *
 * The accessor pattern means the *binding* is fully typechecked end-to-end
 * — if the command's `name` property is a `string`, the field's value type
 * is inferred as `string` and TypeScript catches any mismatch.
 *
 * ## What's unique vs. PrimeReact's `InputText`
 *
 * - Bound to a single command property, no manual `onChange`/`setState`.
 * - Validation state (`invalid` border) is driven automatically from the
 *   `CommandResult.validationResults` returned by the backend's `Handle()`.
 * - All HTML input `type`s PrimeReact supports (`text`, `email`,
 *   `password`, `url`, `tel`, `date`, `datetime-local`, `time`, `color`,
 *   `search`) work the same way.
 *
 * ## Styling
 *
 * Forwards `pt` / `ptOptions` / `unstyled` / `className` to the underlying
 * `InputText`. The default `w-full` class is preserved when consumer
 * `className` is supplied. See [pass-through cheat sheet](../../../Documentation/Styling/pass-through.md).
 *
 * ```tsx
 * <InputTextField value={c => c.email}
 *                 type="email"
 *                 title="Email"
 *                 placeholder="you@example.com" />
 * ```
 */
export const InputTextField = asCommandFormField<InputTextComponentProps>(
    (props) => (
        <InputText
            type={props.type || 'text'}
            value={props.value}
            onChange={props.onChange}
            onBlur={props.onBlur}
            invalid={props.invalid}
            placeholder={props.placeholder}
            className={props.className ? `w-full ${props.className}` : 'w-full'}
            pt={props.pt}
            ptOptions={props.ptOptions}
            unstyled={props.unstyled}
        />
    ),
    {
        defaultValue: '',
        extractValue: (e: React.ChangeEvent<HTMLInputElement>) => e.target.value
    }
);
