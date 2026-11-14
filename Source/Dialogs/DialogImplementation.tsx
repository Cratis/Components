// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DialogResult, DialogButtons } from '@cratis/arc.react/dialogs';
import { useId, useSyncExternalStore } from 'react';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import { DialogInitialFocus } from './DialogInitialFocus';
import type { DialogProps } from './Dialog';
import { resolveDialogDismissal } from './resolveDialogDismissal';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { useCratisIcon } from '../configuration/useCratisIcon';
import { DIALOG_ZINDEX_TOKEN } from '../renderer/dialogStack';
import { useComponentPresentation } from '../configuration/identity/useComponentPresentation';
import { dialogDescriptor } from './dialogDescriptor';
import { DialogDocument } from './DialogDocument';
import { DialogModalShell, DialogServerShell } from './DialogShells';
import { resolveDialogLabels } from './resolveDialogLabels';
import { useDialogClose } from './useDialogClose';
import { useDialogFocus } from './useDialogFocus';
import { useDialogZIndex } from './useDialogZIndex';

const subscribeToBrowserEnvironment = () => () => undefined;
const useIsBrowser = () =>
    useSyncExternalStore(
        subscribeToBrowserEnvironment,
        () => true,
        () => false,
    );

// A cancel-focused dialog without a dismissing button falls back to focusing the content.
const resolveInitialFocus = (initialFocus: DialogInitialFocus, buttons: DialogProps['buttons']) => {
    const hasDismissingButton = typeof buttons === 'number' && buttons !== DialogButtons.Ok;
    return initialFocus === DialogInitialFocus.Cancel && !hasDismissingButton ? DialogInitialFocus.Content : initialFocus;
};

const dismissalFor = (props: DialogProps, isBusy: boolean) =>
    resolveDialogDismissal({
        buttons: props.buttons ?? DialogButtons.OkCancel,
        dismissable: props.dismissable,
        dismissOnOutsideClick: props.dismissOnOutsideClick,
        closeOnEscape: props.closeOnEscape,
        showCloseButton: props.showCloseButton,
        isBusy,
    });

/**
 * A modal dialog with Arc host integration, typed footer actions, busy/validity
 * state, controlled dismissal, and stable Cratis-owned styling parts.
 */
export const DialogImplementation = (incomingProps: DialogProps) => {
    const [props, marker] = useComponentPresentation(dialogDescriptor, incomingProps);
    const {
        title,
        subtitle,
        placement = 'center',
        closeIcon,
        headerActions,
        hideGlobalHeaderActions = false,
        sliceLocation,
        isCommandDialog = false,
        visible = true,
        buttons = DialogButtons.OkCancel,
        initialFocus = DialogInitialFocus.Confirm,
        children,
        width = '450px',
        isValid,
        isBusy = false,
        pt,
    } = props;
    const { messages, dialogHeaderActions } = useCratisComponentsConfig();
    const dialogId = useId();
    const subtitleId = useId();
    const labels = resolveDialogLabels(props, messages?.dialog);
    const icon = useCratisIcon();
    const isBrowser = useIsBrowser();
    const overlayEnvironment = unstable_useOverlayEnvironment();

    const hasHeaderActions =
        headerActions != null || (dialogHeaderActions !== undefined && !hideGlobalHeaderActions);
    const hasSubtitle = subtitle !== undefined && subtitle !== null && subtitle !== false;
    const resolvedInitialFocus = resolveInitialFocus(initialFocus, buttons);
    const focus = {
        confirm: resolvedInitialFocus === DialogInitialFocus.Confirm,
        dismissing: resolvedInitialFocus === DialogInitialFocus.Cancel,
    };
    const { allowsOutsideDismissal, allowsEscapeDismissal, showsCloseButton } = dismissalFor(props, isBusy);

    const resolvedZIndex = useDialogZIndex(visible);
    const { titleRef, confirmRef, cancelRef, announcement, onRefused } = useDialogFocus({
        visible,
        isBusy,
        initialFocus: resolvedInitialFocus,
        refusedMessage: labels.refused,
    });
    const handleClose = useDialogClose(props, onRefused);

    const dialogDocument = (
        <DialogDocument
            stackZIndex={resolvedZIndex ?? DIALOG_ZINDEX_TOKEN}
            visible={visible}
            contentStyle={props.contentStyle}
            announcement={announcement}
            header={{
                dialogId,
                title,
                subtitle,
                subtitleId,
                hasSubtitle,
                hasHeaderActions,
                headerActions,
                globalHeaderActions: dialogHeaderActions,
                hideGlobalHeaderActions,
                isCommandDialog,
                sliceLocation,
                showsCloseButton,
                focusesTitle: resolvedInitialFocus === DialogInitialFocus.Content,
                titleRef,
                isBusy,
                closeAriaLabel: labels.closeAria,
                closeIcon: icon('close', '×', closeIcon),
                onClose: () => void handleClose(DialogResult.Cancelled),
                pt,
            }}
            footer={
                buttons === null
                    ? null
                    : {
                          buttons,
                          labels,
                          focus,
                          isBusy,
                          isValid: isValid !== false,
                          pt,
                          confirmRef,
                          cancelRef,
                          onResult: (result) => void handleClose(result),
                      }
            }
        >
            {children}
        </DialogDocument>
    );

    const shell = {
        placement,
        visible,
        isBusy,
        zIndex: resolvedZIndex,
        width,
        style: props.style,
        className: props.className,
        dialogId,
        marker,
        pt,
        children: dialogDocument,
    };

    // useSyncExternalStore supplies the server snapshot during hydration, so this
    // fallback is identical on the server and on the client's first render. React
    // switches to the portaled React Aria modal only after hydration completes.
    if (!isBrowser) return <DialogServerShell {...shell} />;

    return (
        <DialogModalShell
            {...shell}
            portalContainer={overlayEnvironment.getContainer}
            allowsOutsideDismissal={allowsOutsideDismissal}
            allowsEscapeDismissal={allowsEscapeDismissal}
            onDismiss={() => void handleClose(DialogResult.Cancelled)}
        />
    );
};
