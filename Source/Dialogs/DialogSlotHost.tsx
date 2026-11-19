// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DialogButtons, DialogResult } from '@cratis/arc.react/dialogs';
import { createElement, useId, type ComponentType } from 'react';
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
import type { CratisDialogHost, CratisDialogSlotProps } from './DialogHost';
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

/**
 * Builds the Components-owned host of one adapter-rendered dialog: its stack tier, the dialog
 * result flow, the footer and header actions, initial focus and the refused-confirmation
 * announcement, plus the overlay container its descendants portal through.
 * @param props The dialog's public props.
 * @returns The host handed to the adapter and the overlay container for its descendants.
 */
export const useDialogHost = (props: DialogProps) => {
    const { visible = true, isBusy = false, buttons = DialogButtons.OkCancel, subtitle } = props;
    const { messages } = useCratisComponentsConfig();
    const icon = useCratisIcon();
    const id = useId();
    const subtitleId = useId();
    const labels = resolveDialogLabels(props, messages?.dialog);
    const initialFocus = resolveInitialFocus(props.initialFocus ?? DialogInitialFocus.Confirm, buttons);
    const { allowsOutsideDismissal, allowsEscapeDismissal, showsCloseButton } = dismissalFor(props, isBusy);
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
        dismissal: { outside: allowsOutsideDismissal, escape: allowsEscapeDismissal, closeButton: showsCloseButton },
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
        dismiss: () => void handleClose(DialogResult.Cancelled),
        registerOverlayContainer: overlayContainer.register,
    };

    return { host, overlayContainer };
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
    const { host, overlayContainer } = useDialogHost(props);
    return (
        <DialogStackContext value={host.zIndex}>
            <OverlayContainerScope host={overlayContainer}>{createElement(render, { ...props, host })}</OverlayContainerScope>
        </DialogStackContext>
    );
};
