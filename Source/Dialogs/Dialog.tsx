// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DialogResult, DialogButtons, useDialogContext } from '@cratis/arc.react/dialogs';
import { Dialog as AriaDialog, Heading } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import type {
    ButtonHTMLAttributes,
    CSSProperties,
    HTMLAttributes,
    ReactNode,
} from 'react';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { DialogInitialFocus } from './DialogInitialFocus';

export type CloseDialog = (
    result: DialogResult,
) => boolean | void | Promise<boolean> | Promise<void>;

export type ConfirmCallback = () => boolean | void | Promise<boolean> | Promise<void>;
export type CancelCallback = () => boolean | void | Promise<boolean> | Promise<void>;

type DialogPartAttributes<TElement> = HTMLAttributes<TElement> & {
    [attribute: `data-${string}`]: string | number | boolean | undefined;
};

type DialogButtonAttributes = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'value'
>;

/** Stable Cratis-owned parts for styling a {@link Dialog}. */
export interface DialogParts {
    backdrop?: DialogPartAttributes<HTMLDivElement>;
    positioner?: DialogPartAttributes<HTMLDivElement>;
    root?: DialogPartAttributes<HTMLDivElement>;
    header?: DialogPartAttributes<HTMLElement>;
    title?: DialogPartAttributes<HTMLHeadingElement>;
    close?: DialogButtonAttributes;
    content?: DialogPartAttributes<HTMLDivElement>;
    footer?: DialogPartAttributes<HTMLElement>;
    confirm?: DialogButtonAttributes;
    cancel?: DialogButtonAttributes;
}

/** Props for {@link Dialog}. */
export interface DialogProps {
    title: string;
    visible?: boolean;
    onClose?: CloseDialog;
    onConfirm?: ConfirmCallback;
    onCancel?: CancelCallback;
    buttons?: DialogButtons | ReactNode;
    initialFocus?: DialogInitialFocus;
    children: ReactNode;
    width?: string;
    style?: CSSProperties;
    contentStyle?: CSSProperties;
    /** Retained for source compatibility; the dialog is viewport-bounded rather than resizable. */
    resizable?: boolean;
    isValid?: boolean;
    isBusy?: boolean;
    okLabel?: string;
    cancelLabel?: string;
    yesLabel?: string;
    noLabel?: string;
    closeAriaLabel?: string;
    dismissable?: boolean;
    className?: string;
    /** Cratis-owned per-part attributes. */
    pt?: DialogParts;
    /** Retained for source compatibility; Cratis parts always merge. */
    ptOptions?: object;
    /** Retained for source compatibility; consumers always own the CSS. */
    unstyled?: boolean;
}

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

const subscribeToBrowserEnvironment = () => () => undefined;
const useIsBrowser = () =>
    useSyncExternalStore(
        subscribeToBrowserEnvironment,
        () => true,
        () => false,
    );

/**
 * A modal dialog with Arc host integration, typed footer actions, busy/validity
 * state, controlled dismissal, and stable Cratis-owned styling parts.
 */
export const Dialog = ({
    title,
    visible = true,
    onClose,
    onConfirm,
    onCancel,
    buttons = DialogButtons.OkCancel,
    initialFocus = DialogInitialFocus.Confirm,
    children,
    width = '450px',
    style,
    contentStyle,
    isValid,
    isBusy = false,
    okLabel = 'Ok',
    cancelLabel = 'Cancel',
    yesLabel = 'Yes',
    noLabel = 'No',
    closeAriaLabel = 'Close',
    dismissable,
    className,
    pt,
}: DialogProps) => {
    let contextCloseDialog: ((result: DialogResult) => void) | undefined;
    try {
        const context = useDialogContext();
        contextCloseDialog = context?.closeDialog;
    } catch {
        contextCloseDialog = undefined;
    }

    const isBrowser = useIsBrowser();
    const titleRef = useRef<HTMLHeadingElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);

    const isDialogValid = isValid !== false;
    const hasDismissingButton =
        typeof buttons === 'number' && buttons !== DialogButtons.Ok;
    const resolvedInitialFocus =
        initialFocus === DialogInitialFocus.Cancel && !hasDismissingButton
            ? DialogInitialFocus.Content
            : initialFocus;
    const focusesConfirmButton = resolvedInitialFocus === DialogInitialFocus.Confirm;
    const focusesDismissingButton = resolvedInitialFocus === DialogInitialFocus.Cancel;
    const focusesTitle = resolvedInitialFocus === DialogInitialFocus.Content;
    const isDismissable = dismissable ?? typeof buttons === 'number';

    useEffect(() => {
        if (!visible) return;
        const target = focusesConfirmButton
            ? confirmRef.current
            : focusesDismissingButton
              ? cancelRef.current
              : titleRef.current;
        const frame = requestAnimationFrame(() => target?.focus());
        return () => cancelAnimationFrame(frame);
    }, [focusesConfirmButton, focusesDismissingButton, visible]);

    const handleClose = async (result: DialogResult) => {
        let shouldCloseThroughContext = true;

        if (result === DialogResult.Ok || result === DialogResult.Yes) {
            if (onConfirm) {
                const closeResult = await onConfirm();
                shouldCloseThroughContext = closeResult === true;
            } else if (onClose) {
                const closeResult = await onClose(result);
                shouldCloseThroughContext = closeResult !== false;
            }
        } else if (onCancel) {
            const closeResult = await onCancel();
            shouldCloseThroughContext = closeResult === true;
        } else if (onClose) {
            const closeResult = await onClose(result);
            shouldCloseThroughContext = closeResult !== false;
        }

        if (shouldCloseThroughContext) contextCloseDialog?.(result);
    };

    const footerButton = (
        result: DialogResult,
        label: string,
        primary: boolean,
        focused: boolean,
    ) => (
        <button
            key={`${result}-${label}`}
            {...(primary ? pt?.confirm : pt?.cancel)}
            type='button'
            className={classNames(
                'cratis-dialog__button',
                primary
                    ? 'cratis-dialog__button--primary'
                    : 'cratis-dialog__button--secondary',
                primary ? pt?.confirm?.className : pt?.cancel?.className,
            )}
            data-cratis-part={primary ? 'confirm' : 'cancel'}
            ref={primary ? confirmRef : focused ? cancelRef : undefined}
            onClick={() => void handleClose(result)}
            disabled={primary ? !isDialogValid || isBusy : isBusy}
            autoFocus={focused}
            aria-busy={primary && isBusy ? true : undefined}
        >
            {primary && isBusy && (
                <span className='cratis-dialog__spinner' aria-hidden='true' />
            )}
            <span>{label}</span>
        </button>
    );

    const predefinedFooter = () => {
        if (typeof buttons !== 'number') return buttons;

        switch (buttons) {
            case DialogButtons.Ok:
                return footerButton(DialogResult.Ok, okLabel, true, focusesConfirmButton);
            case DialogButtons.OkCancel:
                return (
                    <>
                        {footerButton(
                            DialogResult.Ok,
                            okLabel,
                            true,
                            focusesConfirmButton,
                        )}
                        {footerButton(
                            DialogResult.Cancelled,
                            cancelLabel,
                            false,
                            focusesDismissingButton,
                        )}
                    </>
                );
            case DialogButtons.YesNo:
                return (
                    <>
                        {footerButton(
                            DialogResult.Yes,
                            yesLabel,
                            true,
                            focusesConfirmButton,
                        )}
                        {footerButton(
                            DialogResult.No,
                            noLabel,
                            false,
                            focusesDismissingButton,
                        )}
                    </>
                );
            case DialogButtons.YesNoCancel:
                return (
                    <>
                        {footerButton(
                            DialogResult.Yes,
                            yesLabel,
                            true,
                            focusesConfirmButton,
                        )}
                        {footerButton(DialogResult.No, noLabel, false, false)}
                        {footerButton(
                            DialogResult.Cancelled,
                            cancelLabel,
                            false,
                            focusesDismissingButton,
                        )}
                    </>
                );
            default:
                return null;
        }
    };

    const dialogDocument = (
        <AriaDialog className='cratis-dialog__document'>
            <>
                <header
                    {...pt?.header}
                    className={classNames('cratis-dialog__header', pt?.header?.className)}
                    style={pt?.header?.style}
                    data-cratis-part='header'
                >
                    <Heading
                        {...pt?.title}
                        slot='title'
                        tabIndex={focusesTitle ? -1 : undefined}
                        ref={titleRef}
                        className={classNames(
                            'cratis-dialog__title',
                            pt?.title?.className,
                        )}
                        style={pt?.title?.style}
                        data-cratis-part='title'
                    >
                        {title}
                    </Heading>
                    {isDismissable && (
                        <button
                            {...pt?.close}
                            type='button'
                            className={classNames(
                                'cratis-dialog__close',
                                pt?.close?.className,
                            )}
                            data-cratis-part='close'
                            aria-label={closeAriaLabel}
                            onClick={() => void handleClose(DialogResult.Cancelled)}
                        >
                            <span aria-hidden='true'>×</span>
                        </button>
                    )}
                </header>
                <div
                    {...pt?.content}
                    className={classNames(
                        'cratis-dialog__content',
                        pt?.content?.className,
                    )}
                    style={{ ...pt?.content?.style, ...contentStyle }}
                    data-cratis-part='content'
                >
                    {children}
                </div>
                {buttons !== null && (
                    <footer
                        {...pt?.footer}
                        className={classNames(
                            'cratis-dialog__footer',
                            pt?.footer?.className,
                        )}
                        style={pt?.footer?.style}
                        data-cratis-part='footer'
                    >
                        {predefinedFooter()}
                    </footer>
                )}
            </>
        </AriaDialog>
    );

    const dialogStyle = { width, ...pt?.root?.style, ...style };

    // useSyncExternalStore supplies the server snapshot during hydration, so this
    // fallback is identical on the server and on the client's first render. React
    // switches to the portaled React Aria modal only after hydration completes.
    if (!isBrowser) {
        if (!visible) return null;
        return (
            <div
                {...pt?.backdrop}
                className={classNames('cratis-dialog__backdrop', pt?.backdrop?.className)}
                style={{ zIndex: 1100, ...pt?.backdrop?.style }}
                data-cratis-part='backdrop'
            >
                <div
                    {...pt?.positioner}
                    className={classNames(
                        'cratis-dialog__positioner',
                        pt?.positioner?.className,
                    )}
                    style={pt?.positioner?.style}
                    data-cratis-part='positioner'
                >
                    <section
                        {...pt?.root}
                        className={classNames(
                            'cratis-dialog',
                            pt?.root?.className,
                            className,
                        )}
                        style={dialogStyle}
                        data-cratis-part='root'
                    >
                        {dialogDocument}
                    </section>
                </div>
            </div>
        );
    }

    return (
        <ModalOverlay
            {...pt?.backdrop}
            isOpen={visible}
            onOpenChange={(open) => {
                if (!open) void handleClose(DialogResult.Cancelled);
            }}
            isDismissable={isDismissable}
            isKeyboardDismissDisabled={!isDismissable}
            className={classNames('cratis-dialog__backdrop', pt?.backdrop?.className)}
            style={{ zIndex: 1100, ...pt?.backdrop?.style }}
            data-cratis-part='backdrop'
        >
            <div
                {...pt?.positioner}
                className={classNames(
                    'cratis-dialog__positioner',
                    pt?.positioner?.className,
                )}
                style={pt?.positioner?.style}
                data-cratis-part='positioner'
            >
                <Modal
                    {...pt?.root}
                    className={classNames(
                        'cratis-dialog',
                        pt?.root?.className,
                        className,
                    )}
                    style={dialogStyle}
                    data-cratis-part='root'
                >
                    {dialogDocument}
                </Modal>
            </div>
        </ModalOverlay>
    );
};
