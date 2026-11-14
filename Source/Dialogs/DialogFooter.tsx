// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DialogResult, DialogButtons } from '@cratis/arc.react/dialogs';
import type React from 'react';
import { classNames } from '../ClassNames/classNames';
import type { DialogParts, DialogProps } from './Dialog';
import type { DialogLabels } from './resolveDialogLabels';

interface FooterButton {
    result: DialogResult;
    label: string;
    primary: boolean;
    focused: boolean;
}

interface FocusFlags {
    confirm: boolean;
    dismissing: boolean;
}

/**
 * Describes the predefined footer buttons of a button set.
 * @param buttons The dialog's predefined button set.
 * @param labels The resolved labels.
 * @param focus Which button kind receives the initial focus.
 * @returns The buttons in display order; empty for an unknown set.
 */
const footerButtonsFor = (buttons: DialogButtons, labels: DialogLabels, focus: FocusFlags): FooterButton[] => {
    const primary = (result: DialogResult, label: string): FooterButton => ({ result, label, primary: true, focused: focus.confirm });
    const secondary = (result: DialogResult, label: string, focused = focus.dismissing): FooterButton => ({
        result,
        label,
        primary: false,
        focused,
    });

    switch (buttons) {
        case DialogButtons.Ok:
            return [primary(DialogResult.Ok, labels.ok)];
        case DialogButtons.OkCancel:
            return [primary(DialogResult.Ok, labels.ok), secondary(DialogResult.Cancelled, labels.cancel)];
        case DialogButtons.YesNo:
            return [primary(DialogResult.Yes, labels.yes), secondary(DialogResult.No, labels.no)];
        case DialogButtons.YesNoCancel:
            return [
                primary(DialogResult.Yes, labels.yes),
                secondary(DialogResult.No, labels.no, false),
                secondary(DialogResult.Cancelled, labels.cancel),
            ];
        default:
            return [];
    }
};

interface ButtonProps {
    button: FooterButton;
    isBusy: boolean;
    pt: DialogParts | undefined;
    onResult: (result: DialogResult) => void;
}

interface PrimaryButtonProps extends ButtonProps {
    isValid: boolean;
    confirmRef: React.RefObject<HTMLButtonElement | null>;
}

interface SecondaryButtonProps extends ButtonProps {
    cancelRef: React.RefObject<HTMLButtonElement | null>;
}

const isActivationKey = (key: string) => key === 'Enter' || key === ' ';

// A held key must not re-submit when focus returns after a refusal.
const suppressRepeatedActivation = (event: React.KeyboardEvent) => {
    if (event.repeat && isActivationKey(event.key)) event.preventDefault();
};

const buttonAttributes = (kind: 'primary' | 'secondary', part: DialogParts['confirm']) => ({
    ...part,
    type: 'button' as const,
    className: classNames('cratis-dialog__button', `cratis-dialog__button--${kind}`, part?.className),
});

const primaryAria = (isBusy: boolean) => ({
    'aria-disabled': isBusy || undefined,
    'aria-busy': isBusy || undefined,
});

const activate = (isBusy: boolean, onResult: (result: DialogResult) => void, result: DialogResult) => () => {
    if (!isBusy) onResult(result);
};

const PrimaryButton = ({ button, isBusy, isValid, pt, confirmRef, onResult }: PrimaryButtonProps) => {
    const isDisabled = !isValid || isBusy;
    return (
        <button
            {...buttonAttributes('primary', pt?.confirm)}
            {...primaryAria(isBusy)}
            data-cratis-part='confirm'
            data-disabled={isDisabled || undefined}
            data-busy={isBusy || undefined}
            ref={confirmRef}
            onClick={activate(isBusy, onResult, button.result)}
            onKeyDown={suppressRepeatedActivation}
            disabled={!isValid}
            autoFocus={button.focused}
        >
            {isBusy && <span className='cratis-dialog__spinner' aria-hidden='true' />}
            <span>{button.label}</span>
        </button>
    );
};

const SecondaryButton = ({ button, isBusy, pt, cancelRef, onResult }: SecondaryButtonProps) => (
    <button
        {...buttonAttributes('secondary', pt?.cancel)}
        data-cratis-part='cancel'
        data-disabled={isBusy || undefined}
        data-busy={isBusy || undefined}
        ref={button.focused ? cancelRef : undefined}
        onClick={activate(isBusy, onResult, button.result)}
        disabled={isBusy}
        autoFocus={button.focused}
    >
        <span>{button.label}</span>
    </button>
);

/** Props of the dialog footer. */
export interface DialogFooterProps {
    buttons: NonNullable<DialogProps['buttons']>;
    labels: DialogLabels;
    focus: FocusFlags;
    isBusy: boolean;
    isValid: boolean;
    pt: DialogParts | undefined;
    confirmRef: React.RefObject<HTMLButtonElement | null>;
    cancelRef: React.RefObject<HTMLButtonElement | null>;
    onResult: (result: DialogResult) => void;
}

const FooterButtons = ({ buttons, labels, focus, isBusy, isValid, pt, confirmRef, cancelRef, onResult }: DialogFooterProps) => {
    if (typeof buttons !== 'number') return buttons;
    return footerButtonsFor(buttons, labels, focus).map((button) =>
        button.primary ? (
            <PrimaryButton
                key={`${button.result}-${button.label}`}
                button={button}
                isBusy={isBusy}
                isValid={isValid}
                pt={pt}
                confirmRef={confirmRef}
                onResult={onResult}
            />
        ) : (
            <SecondaryButton
                key={`${button.result}-${button.label}`}
                button={button}
                isBusy={isBusy}
                pt={pt}
                cancelRef={cancelRef}
                onResult={onResult}
            />
        ),
    );
};

/** The dialog footer holding either the predefined buttons or a custom footer. */
export const DialogFooter = (props: DialogFooterProps) => {
    const { buttons, isBusy, pt } = props;
    // The predefined footer keeps the confirm button focusable while busy, so only a custom
    // footer needs the whole scope disabled; predefined secondary buttons disable themselves.
    const isFooterScopeBusy = isBusy && typeof buttons !== 'number';

    return (
        <footer
            {...pt?.footer}
            className={classNames('cratis-dialog__footer', pt?.footer?.className)}
            style={pt?.footer?.style}
            data-cratis-part='footer'
        >
            <fieldset
                className='cratis-dialog__busy-scope cratis-dialog__busy-scope--footer'
                data-cratis-part='busy-scope'
                data-busy={isBusy || undefined}
                disabled={isFooterScopeBusy}
                inert={isFooterScopeBusy}
                aria-busy={isBusy || undefined}
            >
                <FooterButtons {...props} />
            </fieldset>
        </footer>
    );
};
