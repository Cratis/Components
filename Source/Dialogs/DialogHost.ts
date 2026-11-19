// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode, Ref } from 'react';
import type { DialogProps } from './Dialog';

/** Which dismissal paths are currently allowed. Every path is blocked while the dialog is busy. */
export interface CratisDialogHostDismissal {
    /** Whether a pointer press outside the dialog dismisses it. */
    readonly outside: boolean;
    /** Whether Escape dismisses the dialog. */
    readonly escape: boolean;
    /** Whether the header close button is shown. */
    readonly closeButton: boolean;
}

/**
 * What Components keeps owning for an adapter-rendered dialog. Each mounted dialog gets its own
 * host; nothing in it is shared with, or outlives, that dialog.
 *
 * Components owns the dialog stack, the Arc dialog result, the footer actions, the header actions,
 * the busy and validity rules, initial focus, the refused-confirmation announcement, and the overlay
 * environment of the dialog's descendants. The adapter owns the modal shell: the focus trap,
 * Escape, outside press, scroll lock and focus restoration.
 */
export interface CratisDialogHost {
    /** Identity of this host. Stable for the dialog's lifetime and distinct for every dialog. */
    readonly id: string;
    /**
     * Stacking expression of this dialog's tier. Use it for a z-index based modal; a browser
     * top-layer `<dialog>` is ordered by `showModal()` and can ignore it.
     */
    readonly zIndex: string;
    /** The dismissal paths the adapter must honor. */
    readonly dismissal: CratisDialogHostDismissal;
    /** Accessible label for the header close button. */
    readonly closeAriaLabel: string;
    /** Glyph for the header close button. */
    readonly closeIcon: ReactNode;
    /** Id the adapter gives the subtitle element; the dialog is described by it when present. */
    readonly subtitleId: string;
    /** Whether a subtitle is rendered. */
    readonly hasSubtitle: boolean;
    /** Ref for the title heading, which receives focus when initial focus is the content. */
    readonly titleRef: Ref<HTMLHeadingElement>;
    /** The dialog's children as the `content` part, disabled and inert while the dialog is busy. */
    readonly content: ReactNode;
    /** The per-dialog and app-wide header actions as the `header-actions` part, or `null`. */
    readonly headerActions: ReactNode;
    /** The footer actions as the `footer` part, or `null` when the dialog has no footer. */
    readonly footer: ReactNode;
    /** The polite live region announcing refused confirmations. Render it inside the dialog. */
    readonly liveRegion: ReactNode;
    /** Closes through the dialog's cancel path. Call it on an allowed dismissal. */
    dismiss(): void;
    /**
     * Registers the element the dialog's descendant overlays portal into, or clears it with `null`.
     * A top-layer `<dialog>` registers an element inside itself so popovers, tooltips and nested
     * dialogs stay above it and interactive. Pass it as a ref callback.
     */
    registerOverlayContainer(element: HTMLElement | null): void;
}

/** Props an adapter-rendered `dialogs.dialog` receives: the public props plus its {@link CratisDialogHost}. */
export type CratisDialogSlotProps = DialogProps & {
    /** The Components-owned part of this dialog. */
    readonly host: CratisDialogHost;
};
