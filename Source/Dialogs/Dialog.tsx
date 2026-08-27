// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DialogResult, DialogButtons } from '@cratis/arc.react/dialogs';
import type {
    ButtonHTMLAttributes,
    CSSProperties,
    HTMLAttributes,
    ReactNode,
} from 'react';
import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';
import type { DialogInitialFocus } from './DialogInitialFocus';
import { DialogImplementation } from './DialogImplementation';

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
    /**
     * @deprecated The Cratis dialog is viewport-bounded rather than resizable. Remove this prop.
     */
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
    /**
     * @deprecated Cratis parts always merge. Remove this renderer-era option.
     */
    ptOptions?: object;
    /**
     * @deprecated Components always uses consumer-owned CSS. Customize through `pt` and CSS instead.
     */
    unstyled?: boolean;
}

const coreDialogDeclaration = Object.freeze({
    mode: 'atomic',
    fidelity: 'native',
    render: DialogImplementation,
}) satisfies unstable_SlotDeclaration<'dialogs.dialog'>;

/**
 * A modal dialog with Arc host integration, typed footer actions, busy/validity
 * state, controlled dismissal, and stable Cratis-owned styling parts.
 */
export const Dialog = (props: DialogProps) => {
    const declaration = unstable_useSlot('dialogs.dialog', coreDialogDeclaration);
    return renderSlot(declaration, props);
};
