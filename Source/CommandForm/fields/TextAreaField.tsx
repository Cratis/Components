// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { TextareaHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import { unstable_useSlot } from '../../renderer/RendererContext';
import { renderSlot } from '../../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../../renderer/slots';
import type { TextAreaProps } from '../../Common/TextArea';
import { joinClassNames, userChange } from './fieldSlotHelpers';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';

/** Stable part attributes for {@link TextAreaField}. */
export interface TextAreaParts {
    /** Native textarea element. */
    root?: TextareaHTMLAttributes<HTMLTextAreaElement>;
}

interface TextAreaFieldComponentProps
    extends WrappedFieldProps<string>,
        FieldAccessibilityProps {
    placeholder?: string;
    rows?: number;
    cols?: number;
    className?: string;
    pt?: TextAreaParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** Core TextAreaField markup, used when no adapter supplies `common.textArea`. */
const TextAreaFieldCore = ({
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    value,
    onChange,
    onBlur,
    placeholder,
    rows,
    cols,
    invalid,
    className,
    pt,
}: TextAreaProps) => (
    <textarea
        {...pt?.root}
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        value={value}
        onChange={(event) => onChange?.(event.currentTarget.value, userChange(event))}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        cols={cols}
        aria-invalid={invalid || undefined}
        data-disabled={pt?.root?.disabled || undefined}
        data-invalid={invalid || undefined}
        data-readonly={pt?.root?.readOnly || undefined}
        data-cratis-component='TextAreaField'
        data-cratis-part='textarea'
        className={joinClassNames('cratis-field-input', 'cratis-field-textarea', 'cratis:w-full', pt?.root?.className, className)}
    />
);

/** Frozen Core declaration resolved when no active renderer supplies `common.textArea`. */
const coreTextAreaDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: TextAreaFieldCore,
}) satisfies unstable_SlotDeclaration<'common.textArea'>;


/** A multi-line text field bound to a string property on an Arc command. */
export const TextAreaField = asCommandFormField<TextAreaFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.root?.id,
            ariaLabel: props.pt?.root?.['aria-label'],
            ariaDescribedBy: props.pt?.root?.['aria-describedby'],
        });
        const declaration = unstable_useSlot('common.textArea', coreTextAreaDeclaration);
        return (
            <>
                {renderSlot(declaration, {
                    id: accessibility.controlId,
                    'aria-label': accessibility.ariaLabel,
                    'aria-describedby': accessibility.ariaDescribedBy,
                    value: props.value,
                    onChange: (value) => props.onChange(value),
                    onBlur: props.onBlur,
                    placeholder: props.placeholder,
                    rows: props.rows ?? 5,
                    cols: props.cols,
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
