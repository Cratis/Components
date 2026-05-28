// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Dialog as PrimeDialog, type DialogProps as PrimeDialogProps } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DialogResult, DialogButtons, useDialogContext } from '@cratis/arc.react/dialogs';
import { ReactNode } from 'react';

/**
 * Callback used by {@link Dialog} (and its wrappers) when the dialog is about to
 * close. Returning `false` (sync or via promise) keeps the dialog open — useful
 * for confirming or surfacing an error to the user before letting it close.
 */
export type CloseDialog = (result: DialogResult) => boolean | void | Promise<boolean> | Promise<void>;

/**
 * Callback invoked when the user activates the confirm action (Ok / Yes).
 * Return `false` (sync or via promise) to keep the dialog open after the
 * confirm callback completes.
 */
export type ConfirmCallback = () => boolean | void | Promise<boolean> | Promise<void>;

/**
 * Callback invoked when the user activates the cancel / dismiss action.
 * Return `false` to keep the dialog open after the cancel callback completes.
 */
export type CancelCallback = () => boolean | void | Promise<boolean> | Promise<void>;

/**
 * Props for {@link Dialog}.
 */
export interface DialogProps {
    /** Header text shown at the top of the dialog. */
    title: string;

    /** Controls visibility. Defaults to `true`; set to `false` to hide without unmounting. */
    visible?: boolean;

    /**
     * Catch-all close callback invoked for both confirm and cancel paths when no
     * matching {@link onConfirm} / {@link onCancel} handler is supplied. Receives
     * the {@link DialogResult} the user produced.
     */
    onClose?: CloseDialog;

    /** Invoked when the user activates the confirm action (Ok / Yes). */
    onConfirm?: ConfirmCallback;

    /** Invoked when the user activates the cancel / dismiss action. */
    onCancel?: CancelCallback;

    /**
     * Footer button configuration. Pass a {@link DialogButtons} value for one of
     * the predefined sets (`Ok`, `OkCancel`, `YesNo`, `YesNoCancel`), `null` for
     * no footer, or a custom React node to fully render your own footer.
     * Defaults to `DialogButtons.OkCancel`.
     */
    buttons?: DialogButtons | ReactNode;

    /** Dialog body content. */
    children: ReactNode;

    /** Dialog width, any valid CSS length. Defaults to `'450px'`. */
    width?: string;

    /** Inline style forwarded to the underlying PrimeReact Dialog root. */
    style?: PrimeDialogProps['style'];

    /** Inline style forwarded to the dialog's inner content area. */
    contentStyle?: PrimeDialogProps['contentStyle'];

    /** When true, allows the user to resize the dialog. Defaults to `false`. */
    resizable?: boolean;

    /**
     * Controls whether the confirm button is enabled. Defaults to `true` when
     * omitted; set to `false` to disable confirm (e.g. when form validation
     * fails).
     */
    isValid?: boolean;

    /**
     * When true, disables all dialog buttons and shows a loading state on the
     * confirm button. Used by command-executing wrappers while a command runs.
     */
    isBusy?: boolean;

    /** Override the Ok button label. Defaults to `'Ok'`. */
    okLabel?: string;

    /** Override the Cancel button label. Defaults to `'Cancel'`. */
    cancelLabel?: string;

    /** Override the Yes button label. Defaults to `'Yes'`. */
    yesLabel?: string;

    /** Override the No button label. Defaults to `'No'`. */
    noLabel?: string;

    /**
     * Extra CSS class names forwarded to the underlying PrimeReact Dialog root.
     */
    className?: string;

    /**
     * PrimeReact pass-through configuration. Applies to the underlying Dialog's
     * slots — see PrimeReact's Dialog `pt` reference for the available keys.
     * Use this (or set a global preset on `CratisComponentsProvider`) to take
     * full control of styling.
     */
    pt?: PrimeDialogProps['pt'];

    /**
     * PrimeReact pass-through options. Controls merge vs. replace behavior for
     * the {@link pt} preset.
     */
    ptOptions?: PrimeDialogProps['ptOptions'];

    /**
     * When true, disables every base PrimeReact style on the underlying Dialog.
     * Combine with {@link pt} or with the global setting from
     * `CratisComponentsProvider` to fully restyle.
     */
    unstyled?: boolean;
}

/**
 * Cratis wrapper around PrimeReact's `Dialog` that provides:
 *
 * - A typed footer-button enum (`DialogButtons.Ok` / `OkCancel` / `YesNo` /
 *   `YesNoCancel`) with localizable labels.
 * - A confirm/cancel callback contract (`onConfirm`, `onCancel`, `onClose`)
 *   where returning `false` keeps the dialog open — useful for surfacing
 *   inline command failures.
 * - A busy state that disables actions and shows a loading indicator on the
 *   confirm button while a command runs.
 * - Pass-through of `pt`, `ptOptions`, `unstyled`, and `className` to the
 *   underlying PrimeReact Dialog so consumers can fully restyle it.
 * - Automatic integration with `@cratis/arc.react`'s `DialogContext` when
 *   used inside a `<DialogHost>` — the dialog closes through the host on
 *   confirm/cancel without manual wiring.
 *
 * ```tsx
 * <Dialog title="Delete project?" buttons={DialogButtons.YesNo}
 *         onConfirm={() => deleteProject(id)}>
 *     This action cannot be undone.
 * </Dialog>
 * ```
 *
 * @param props - {@link DialogProps}.
 */

export const Dialog = ({
    title,
    visible = true,
    onClose,
    onConfirm,
    onCancel,
    buttons = DialogButtons.OkCancel,
    children,
    width = '450px',
    style,
    contentStyle,
    resizable = false,
    isValid,
    isBusy = false,
    okLabel = 'Ok',
    cancelLabel = 'Cancel',
    yesLabel = 'Yes',
    noLabel = 'No',
    className,
    pt,
    ptOptions,
    unstyled
}: DialogProps) => {
    // useDialogContext() is called unconditionally on every render — the try/catch only suppresses
    // the exception when Dialog is used standalone (outside a provider). React's Rules of Hooks
    // are not violated because the hook is always called; the try/catch never skips the call.
    let contextCloseDialog: ((result: DialogResult) => void) | undefined;
    try {
        const context = useDialogContext();
        contextCloseDialog = context?.closeDialog;
    } catch {
        contextCloseDialog = undefined;
    }
    
    const isDialogValid = isValid !== false;
    const headerElement = (
        <div className="inline-flex items-center justify-center gap-2">
            <span className="font-bold whitespace-nowrap">{title}</span>
        </div>
    );

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
        } else {
            if (onCancel) {
                const closeResult = await onCancel();
                shouldCloseThroughContext = closeResult === true;
            } else if (onClose) {
                const closeResult = await onClose(result);
                shouldCloseThroughContext = closeResult !== false;
            }
        }

        if (shouldCloseThroughContext) {
            contextCloseDialog?.(result);
        }
    };

    const okFooter = (
        <>
            <Button label={okLabel} icon="pi pi-check" onClick={() => handleClose(DialogResult.Ok)} disabled={!isDialogValid || isBusy} loading={isBusy} autoFocus />
        </>
    );

    const okCancelFooter = (
        <>
            <Button label={okLabel} icon="pi pi-check" onClick={() => handleClose(DialogResult.Ok)} disabled={!isDialogValid || isBusy} loading={isBusy} autoFocus />
            <Button label={cancelLabel} icon="pi pi-times" outlined onClick={() => handleClose(DialogResult.Cancelled)} disabled={isBusy} />
        </>
    );

    const yesNoFooter = (
        <>
            <Button label={yesLabel} icon="pi pi-check" onClick={() => handleClose(DialogResult.Yes)} disabled={!isDialogValid || isBusy} loading={isBusy} autoFocus />
            <Button label={noLabel} icon="pi pi-times" outlined onClick={() => handleClose(DialogResult.No)} disabled={isBusy} />
        </>
    );

    const yesNoCancelFooter = (
        <>
            <Button label={yesLabel} icon="pi pi-check" onClick={() => handleClose(DialogResult.Yes)} disabled={!isDialogValid || isBusy} loading={isBusy} autoFocus />
            <Button label={noLabel} icon="pi pi-times" outlined onClick={() => handleClose(DialogResult.No)} disabled={isBusy} />
            <Button label={cancelLabel} icon="pi pi-times" outlined onClick={() => handleClose(DialogResult.Cancelled)} disabled={isBusy} />
        </>
    );

    const getFooterInterior = () => {
        // If buttons is a ReactNode (custom buttons), use it directly
        if (typeof buttons !== 'number') {
            return buttons;
        }

        // Otherwise, use predefined buttons based on DialogButtons enum
        switch (buttons) {
            case DialogButtons.Ok:
                return okFooter;
            case DialogButtons.OkCancel:
                return okCancelFooter;
            case DialogButtons.YesNo:
                return yesNoFooter;
            case DialogButtons.YesNoCancel:
                return yesNoCancelFooter;
        }

        return (<></>);
    };

    const footer = (
        <div className="flex flex-wrap justify-start gap-3">
            {getFooterInterior()}
        </div>
    );

    return (
        <PrimeDialog
            header={headerElement}
            modal
            footer={footer}
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onHide={typeof buttons === 'number' ? () => handleClose(DialogResult.Cancelled) : () => {}}
            visible={visible}
            style={{ width, ...style }}
            contentStyle={contentStyle}
            resizable={resizable}
            closable={typeof buttons === 'number'}
            className={className}
            pt={pt}
            ptOptions={ptOptions}
            unstyled={unstyled}>
            {children}
        </PrimeDialog>
    );
};
