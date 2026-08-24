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
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';

/** Callback handling a typed dialog result; return `false` to keep the dialog open. */
export type CloseDialog = (
    result: DialogResult,
) => boolean | void | Promise<boolean> | Promise<void>;

/** Confirmation callback; return `true` to permit host closure. */
export type ConfirmCallback = () => boolean | void | Promise<boolean> | Promise<void>;
/** Cancellation callback; return `true` to permit host closure. */
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
    /** Viewport backdrop and dismissal surface. */
    backdrop?: DialogPartAttributes<HTMLDivElement>;
    /** Viewport positioning wrapper. */
    positioner?: DialogPartAttributes<HTMLDivElement>;
    /** Modal root. */
    root?: DialogPartAttributes<HTMLDivElement>;
    /** Header containing title and optional close action. */
    header?: DialogPartAttributes<HTMLElement>;
    /** Dialog heading. */
    title?: DialogPartAttributes<HTMLHeadingElement>;
    /** Header close button. */
    close?: DialogButtonAttributes;
    /** Dialog content region. */
    content?: DialogPartAttributes<HTMLDivElement>;
    /** Footer action region. */
    footer?: DialogPartAttributes<HTMLElement>;
    /** Primary confirmation button. */
    confirm?: DialogButtonAttributes;
    /** Secondary dismissal button(s). */
    cancel?: DialogButtonAttributes;
}

/** Props for {@link Dialog}. */
export interface DialogProps {
    /** Dialog heading. */
    title: string;
    /** Controlled open state. Defaults to `true`. */
    visible?: boolean;
    /** Combined result callback used when a dedicated confirm/cancel callback is absent. */
    onClose?: CloseDialog;
    /** Invoked by primary confirmation actions. */
    onConfirm?: ConfirmCallback;
    /** Invoked by cancellation actions. */
    onCancel?: CancelCallback;
    /** Predefined Arc buttons, custom footer content, or `null` for no footer. */
    buttons?: DialogButtons | ReactNode;
    /** Initial focus target. Defaults to the confirmation action. */
    initialFocus?: DialogInitialFocus;
    /** Dialog body content. */
    children: ReactNode;
    /** CSS width. Defaults to `450px`. */
    width?: string;
    /** Modal-root inline style. */
    style?: CSSProperties;
    /** Content-region inline style. */
    contentStyle?: CSSProperties;
    /** Retained for source compatibility; the dialog is viewport-bounded rather than resizable. */
    resizable?: boolean;
    /** Whether the primary action is enabled. Defaults to `true`. */
    isValid?: boolean;
    /** Disables every action and dismissal path while work is in flight. */
    isBusy?: boolean;
    /** Label for the Ok action. Falls back to the provider's `dialog.ok` message, then `'Ok'`. */
    okLabel?: string;
    /** Label for the Cancel action. Falls back to the provider's `dialog.cancel` message, then `'Cancel'`. */
    cancelLabel?: string;
    /** Label for the Yes action. Falls back to the provider's `dialog.yes` message, then `'Yes'`. */
    yesLabel?: string;
    /** Label for the No action. Falls back to the provider's `dialog.no` message, then `'No'`. */
    noLabel?: string;
    /** Accessible label for the header close button. Falls back to the provider's `dialog.close` message, then `'Close'`. */
    closeAriaLabel?: string;
    /** Enables header, Escape, and backdrop dismissal when not busy. */
    dismissable?: boolean;
    /** Extra class name for the modal root. */
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
    okLabel,
    cancelLabel,
    yesLabel,
    noLabel,
    closeAriaLabel,
    dismissable,
    className,
    pt,
}: DialogProps) => {
    const { messages } = useCratisComponentsConfig();
    const dialogMessages = messages?.dialog;
    const resolvedOkLabel = okLabel ?? dialogMessages?.ok ?? 'Ok';
    const resolvedCancelLabel = cancelLabel ?? dialogMessages?.cancel ?? 'Cancel';
    const resolvedYesLabel = yesLabel ?? dialogMessages?.yes ?? 'Yes';
    const resolvedNoLabel = noLabel ?? dialogMessages?.no ?? 'No';
    const resolvedCloseAriaLabel = closeAriaLabel ?? dialogMessages?.close ?? 'Close';
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
    const allowsDismissal = dismissable ?? typeof buttons === 'number';
    const isDismissable = allowsDismissal && !isBusy;

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
                return footerButton(
                    DialogResult.Ok,
                    resolvedOkLabel,
                    true,
                    focusesConfirmButton,
                );
            case DialogButtons.OkCancel:
                return (
                    <>
                        {footerButton(
                            DialogResult.Ok,
                            resolvedOkLabel,
                            true,
                            focusesConfirmButton,
                        )}
                        {footerButton(
                            DialogResult.Cancelled,
                            resolvedCancelLabel,
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
                            resolvedYesLabel,
                            true,
                            focusesConfirmButton,
                        )}
                        {footerButton(
                            DialogResult.No,
                            resolvedNoLabel,
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
                            resolvedYesLabel,
                            true,
                            focusesConfirmButton,
                        )}
                        {footerButton(DialogResult.No, resolvedNoLabel, false, false)}
                        {footerButton(
                            DialogResult.Cancelled,
                            resolvedCancelLabel,
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
                    {allowsDismissal && (
                        <button
                            {...pt?.close}
                            type='button'
                            disabled={isBusy}
                            className={classNames(
                                'cratis-dialog__close',
                                pt?.close?.className,
                            )}
                            data-cratis-part='close'
                            aria-label={resolvedCloseAriaLabel}
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
                    <fieldset
                        className='cratis-dialog__busy-scope'
                        data-cratis-part='busy-scope'
                        disabled={isBusy}
                        inert={isBusy}
                        aria-busy={isBusy || undefined}
                    >
                        {children}
                    </fieldset>
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
                        <fieldset
                            className='cratis-dialog__busy-scope cratis-dialog__busy-scope--footer'
                            data-cratis-part='busy-scope'
                            disabled={isBusy}
                            inert={isBusy}
                            aria-busy={isBusy || undefined}
                        >
                            {predefinedFooter()}
                        </fieldset>
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
                style={{
                    zIndex: 'var(--cratis-z-index-dialog)',
                    ...pt?.backdrop?.style,
                }}
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
                if (!open && !isBusy) void handleClose(DialogResult.Cancelled);
            }}
            isDismissable={isDismissable}
            isKeyboardDismissDisabled={!isDismissable}
            className={classNames('cratis-dialog__backdrop', pt?.backdrop?.className)}
            style={{
                zIndex: 'var(--cratis-z-index-dialog)',
                ...pt?.backdrop?.style,
            }}
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
