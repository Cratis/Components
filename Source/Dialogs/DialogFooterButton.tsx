// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef } from 'react';
import { classNames } from '../ClassNames/classNames';
import type { ButtonProps } from '../Common/Button';
import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';

/**
 * The predefined footer buttons resolve through the `common.button` slot. The button kind travels as
 * the slot's `variant`: `solid` is the confirming (primary) button, `outline` a dismissing one.
 */

const PrimaryFooterButton = forwardRef<HTMLButtonElement, ButtonProps>(function PrimaryFooterButton(
    { label, icon, pt, type, disabled, autoFocus, onClick, onKeyDown, 'aria-disabled': ariaDisabled, 'aria-busy': ariaBusy },
    ref,
) {
    return (
        <button
            {...pt?.root}
            type={type}
            className={classNames('cratis-dialog__button', 'cratis-dialog__button--primary', pt?.root?.className)}
            aria-disabled={ariaDisabled}
            aria-busy={ariaBusy}
            data-cratis-part='confirm'
            data-disabled={disabled || ariaDisabled ? true : undefined}
            data-busy={ariaBusy ? true : undefined}
            ref={ref}
            onClick={onClick}
            onKeyDown={onKeyDown}
            disabled={disabled}
            autoFocus={autoFocus}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
});

const SecondaryFooterButton = forwardRef<HTMLButtonElement, ButtonProps>(function SecondaryFooterButton(
    { label, pt, type, disabled, autoFocus, onClick },
    ref,
) {
    return (
        <button
            {...pt?.root}
            type={type}
            className={classNames('cratis-dialog__button', 'cratis-dialog__button--secondary', pt?.root?.className)}
            data-cratis-part='cancel'
            data-disabled={disabled || undefined}
            data-busy={disabled || undefined}
            ref={ref}
            onClick={onClick}
            disabled={disabled}
            autoFocus={autoFocus}
        >
            <span>{label}</span>
        </button>
    );
});

const DialogFooterButtonImplementation = forwardRef<HTMLButtonElement, ButtonProps>(
    function DialogFooterButtonImplementation(props, ref) {
        return props.variant === 'solid' ? <PrimaryFooterButton {...props} ref={ref} /> : <SecondaryFooterButton {...props} ref={ref} />;
    },
);

/** Core presentation of a footer button, used when no adapter provides `common.button`. */
export const footerButtonDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: DialogFooterButtonImplementation,
}) satisfies unstable_SlotDeclaration<'common.button'>;

/**
 * Resolves the declaration a footer button renders through.
 * @returns The active adapter's `common.button` declaration, or the core footer button.
 */
export const useFooterButton = () => unstable_useSlot('common.button', footerButtonDeclaration);

export { renderSlot as renderFooterButton };
