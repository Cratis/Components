// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DialogResult, DialogButtons, useDialogContext } from '@cratis/arc.react/dialogs';
import { Dialog as AriaDialog, Heading } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { UNSAFE_PortalProvider } from 'react-aria';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import { DialogInitialFocus } from './DialogInitialFocus';
import type { DialogProps } from './Dialog';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';

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
export const DialogImplementation = ({
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
    const overlayEnvironment = unstable_useOverlayEnvironment();
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
            data-disabled={(primary ? !isDialogValid || isBusy : isBusy) || undefined}
            data-busy={isBusy || undefined}
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
                            data-disabled={isBusy || undefined}
                            data-busy={isBusy || undefined}
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
                    data-open={visible || undefined}
                    data-busy={isBusy || undefined}
                >
                    <fieldset
                        className='cratis-dialog__busy-scope'
                        data-cratis-part='busy-scope'
                        data-busy={isBusy || undefined}
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
                            data-busy={isBusy || undefined}
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
                data-open={visible || undefined}
                data-busy={isBusy || undefined}
            >
                <div
                    {...pt?.positioner}
                    className={classNames(
                        'cratis-dialog__positioner',
                        pt?.positioner?.className,
                    )}
                    style={pt?.positioner?.style}
                    data-cratis-part='positioner'
                    data-open={visible || undefined}
                    data-busy={isBusy || undefined}
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
                        data-open={visible || undefined}
                        data-busy={isBusy || undefined}
                    >
                        {dialogDocument}
                    </section>
                </div>
            </div>
        );
    }

    return (
        <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
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
                data-open={visible || undefined}
                data-busy={isBusy || undefined}
            >
                <div
                    {...pt?.positioner}
                    className={classNames(
                        'cratis-dialog__positioner',
                        pt?.positioner?.className,
                    )}
                    style={pt?.positioner?.style}
                    data-cratis-part='positioner'
                    data-open={visible || undefined}
                    data-busy={isBusy || undefined}
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
                        data-open={visible || undefined}
                        data-busy={isBusy || undefined}
                    >
                        {dialogDocument}
                    </Modal>
                </div>
            </ModalOverlay>
        </UNSAFE_PortalProvider>
    );
};
