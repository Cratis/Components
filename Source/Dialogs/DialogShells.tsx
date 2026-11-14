// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { UNSAFE_PortalProvider } from 'react-aria';
import type React from 'react';
import { dialogPartAttributes } from './dialogPartAttributes';
import { DIALOG_ZINDEX_TOKEN } from '../renderer/dialogStack';
import type { ComponentMarkerAttributes } from '../configuration/identity/ComponentMarkerAttributes';
import type { DialogParts, DialogProps } from './Dialog';

/** What every dialog shell needs to render the backdrop, positioner and root parts. */
export interface DialogShellProps {
    placement: NonNullable<DialogProps['placement']>;
    visible: boolean;
    isBusy: boolean;
    zIndex: string | undefined;
    width: string;
    style: React.CSSProperties | undefined;
    className: string | undefined;
    dialogId: string;
    marker: ComponentMarkerAttributes;
    pt: DialogParts | undefined;
    children: React.ReactNode;
}

interface ModalShellProps extends DialogShellProps {
    portalContainer: () => HTMLElement | null;
    allowsOutsideDismissal: boolean;
    allowsEscapeDismissal: boolean;
    onDismiss: () => void;
}

const backdropStyle = ({ zIndex, pt }: DialogShellProps): React.CSSProperties => ({
    zIndex: zIndex ?? DIALOG_ZINDEX_TOKEN,
    ...pt?.backdrop?.style,
});

const rootStyle = ({ width, pt, style }: DialogShellProps): React.CSSProperties => ({
    width,
    ...pt?.root?.style,
    ...style,
});

interface ShellLayersProps {
    shell: DialogShellProps;
    Backdrop: React.ElementType;
    backdropProps?: object;
    Root: React.ElementType;
}

/** The backdrop, positioner and root parts shared by the server and the modal shell. */
const ShellLayers = ({ shell, Backdrop, backdropProps, Root }: ShellLayersProps) => {
    const { pt, placement, visible, isBusy, className, dialogId, marker, children } = shell;

    return (
        <Backdrop
            {...dialogPartAttributes(pt?.backdrop, 'cratis-dialog__backdrop', backdropStyle(shell))}
            {...backdropProps}
            data-cratis-part='backdrop'
            data-placement={placement}
            data-open={visible || undefined}
            data-busy={isBusy || undefined}
        >
            <div
                {...dialogPartAttributes(pt?.positioner, 'cratis-dialog__positioner')}
                data-cratis-part='positioner'
                data-placement={placement}
                data-open={visible || undefined}
                data-busy={isBusy || undefined}
            >
                <Root
                    {...dialogPartAttributes(pt?.root, 'cratis-dialog', rootStyle(shell), className)}
                    data-cratis-part='root'
                    {...marker}
                    data-cratis-dialog-id={dialogId}
                    data-placement={placement}
                    data-open={visible || undefined}
                    data-busy={isBusy || undefined}
                >
                    {children}
                </Root>
            </div>
        </Backdrop>
    );
};

/** The server and first-hydration shell, identical on both so hydration matches. */
export const DialogServerShell = (shell: DialogShellProps) =>
    shell.visible ? <ShellLayers shell={shell} Backdrop='div' Root='section' /> : null;

/** The portaled React Aria modal shell used once the client has hydrated. */
export const DialogModalShell = (props: ModalShellProps) => {
    const { visible, isBusy } = props;
    const backdropProps = {
        isOpen: visible,
        onOpenChange: (open: boolean) => {
            if (!open && !isBusy) props.onDismiss();
        },
        isDismissable: props.allowsOutsideDismissal,
        isKeyboardDismissDisabled: !props.allowsEscapeDismissal,
    };

    return (
        <UNSAFE_PortalProvider getContainer={props.portalContainer}>
            <ShellLayers shell={props} Backdrop={ModalOverlay} backdropProps={backdropProps} Root={Modal} />
        </UNSAFE_PortalProvider>
    );
};
