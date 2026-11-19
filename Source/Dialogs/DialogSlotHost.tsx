// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DialogButtons, DialogResult } from '@cratis/arc.react/dialogs';
import { createContext, createElement, use, useEffect, useId, useState, type ComponentType } from 'react';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { useCratisIcon } from '../configuration/useCratisIcon';
import { DIALOG_ZINDEX_TOKEN } from '../renderer/dialogStack';
import { DialogStackContext } from '../renderer/DialogStackContext';
import { OverlayContainerScope, useOverlayContainer } from '../renderer/OverlayContainerScope';
import type { DialogProps } from './Dialog';
import { dismissalFor, resolveInitialFocus } from './dialogBehavior';
import { DialogContent, LiveRegion } from './DialogDocument';
import { DialogFooter } from './DialogFooter';
import { HeaderActions } from './DialogHeader';
import type { CratisDialogDismissSource, CratisDialogHost, CratisDialogHostDismissal, CratisDialogSlotProps } from './DialogHost';
import { DialogInitialFocus } from './DialogInitialFocus';
import { resolveDialogLabels } from './resolveDialogLabels';
import { useDialogClose } from './useDialogClose';
import { useDialogFocus } from './useDialogFocus';
import { useDialogZIndex } from './useDialogZIndex';

const useHeaderActions = (props: DialogProps, dialogId: string, showsCloseButton: boolean) => {
    const { dialogHeaderActions } = useCratisComponentsConfig();
    const { headerActions, hideGlobalHeaderActions = false } = props;
    const hasHeaderActions =
        headerActions != null || (dialogHeaderActions !== undefined && !hideGlobalHeaderActions);
    if (!hasHeaderActions) return null;
    return (
        <HeaderActions
            dialogId={dialogId}
            title={props.title}
            headerActions={headerActions}
            globalHeaderActions={dialogHeaderActions}
            hideGlobalHeaderActions={hideGlobalHeaderActions}
            isCommandDialog={props.isCommandDialog ?? false}
            sliceLocation={props.sliceLocation}
            showsCloseButton={showsCloseButton}
            pt={props.pt}
        />
    );
};

// Whether the adapter dialogs rendered inside may open: false until the nearest adapter dialog has
// committed its own open state, so modals open parent-first, and false as soon as it hides.
const DescendantsMayOpenContext = createContext(true);

// Passive effects run children-first, so this runs after the adapter dialog below opened itself.
const useDescendantsMayOpen = (visible: boolean) => {
    const [opened, setOpened] = useState(false);
    useEffect(() => setOpened(visible), [visible]);
    return visible && opened;
};

interface DismissGuard {
    readonly visible: boolean;
    readonly isBusy: boolean;
    readonly dismissal: CratisDialogHostDismissal;
}

const mayDismiss = ({ visible, isBusy, dismissal }: DismissGuard, source: CratisDialogDismissSource) =>
    visible && !isBusy && dismissal[source];

/**
 * Builds the Components-owned host of one adapter-rendered dialog: its stack tier, the dialog
 * result flow, the footer and header actions, initial focus and the refused-confirmation
 * announcement, plus the overlay container its descendants portal through.
 * @param props The dialog's public props.
 * @returns The host handed to the adapter and the overlay container for its descendants.
 */
export const useDialogHost = (props: DialogProps) => {
    const { isBusy = false, buttons = DialogButtons.OkCancel, subtitle } = props;
    // A dialog nested in a hidden or still-opening adapter dialog stays closed until its parent is open.
    const visible = (props.visible ?? true) && use(DescendantsMayOpenContext);
    const { messages } = useCratisComponentsConfig();
    const icon = useCratisIcon();
    const id = useId();
    const subtitleId = useId();
    const labels = resolveDialogLabels(props, messages?.dialog);
    const initialFocus = resolveInitialFocus(props.initialFocus ?? DialogInitialFocus.Confirm, buttons);
    const { allowsOutsideDismissal, allowsEscapeDismissal, showsCloseButton } = dismissalFor(props, isBusy);
    const dismissal = { outside: allowsOutsideDismissal, escape: allowsEscapeDismissal, closeButton: showsCloseButton };
    const zIndex = useDialogZIndex(visible) ?? DIALOG_ZINDEX_TOKEN;
    const overlayContainer = useOverlayContainer(visible);
    const { titleRef, confirmRef, cancelRef, announcement, onRefused } = useDialogFocus({
        visible,
        isBusy,
        initialFocus,
        refusedMessage: labels.refused,
    });
    const handleClose = useDialogClose(props, onRefused);

    const host: CratisDialogHost = {
        id,
        zIndex,
        dismissal,
        closeAriaLabel: labels.closeAria,
        closeIcon: icon('close', '×', props.closeIcon),
        subtitleId,
        hasSubtitle: subtitle !== undefined && subtitle !== null && subtitle !== false,
        titleRef,
        content: (
            <DialogContent visible={visible} isBusy={isBusy} contentStyle={props.contentStyle} pt={props.pt}>
                {props.children}
            </DialogContent>
        ),
        headerActions: useHeaderActions(props, id, showsCloseButton),
        footer:
            buttons === null ? null : (
                <DialogFooter
                    buttons={buttons}
                    labels={labels}
                    focus={{
                        confirm: initialFocus === DialogInitialFocus.Confirm,
                        dismissing: initialFocus === DialogInitialFocus.Cancel,
                    }}
                    isBusy={isBusy}
                    isValid={props.isValid !== false}
                    pt={props.pt}
                    confirmRef={confirmRef}
                    cancelRef={cancelRef}
                    onResult={(result) => void handleClose(result)}
                />
            ),
        liveRegion: <LiveRegion announcement={announcement} />,
        dismiss: (source) => {
            if (mayDismiss({ visible, isBusy, dismissal }, source)) void handleClose(DialogResult.Cancelled);
        },
        registerOverlayContainer: overlayContainer.register,
    };

    return { host, overlayContainer, visible };
};

/** Props of {@link DialogSlotHost}. */
export interface DialogSlotHostProps {
    /** The adapter's dialog implementation. */
    readonly render: ComponentType<CratisDialogSlotProps>;
    /** The dialog's public props. */
    readonly props: DialogProps;
}

/**
 * Renders an adapter-owned dialog with its Components-owned host. Descendants read this dialog's
 * stack tier and portal through the overlay element the adapter registered.
 */
export const DialogSlotHost = ({ render, props }: DialogSlotHostProps) => {
    const { host, overlayContainer, visible } = useDialogHost(props);
    const descendantsMayOpen = useDescendantsMayOpen(visible);
    return (
        <DialogStackContext value={host.zIndex}>
            <DescendantsMayOpenContext value={descendantsMayOpen}>
                <OverlayContainerScope host={overlayContainer}>
                    {createElement(render, { ...props, visible, host })}
                </OverlayContainerScope>
            </DescendantsMayOpenContext>
        </DialogStackContext>
    );
};
