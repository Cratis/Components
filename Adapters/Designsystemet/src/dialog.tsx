// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    useLayoutEffect,
    useRef,
    type CSSProperties,
    type MouseEvent,
    type PointerEvent,
    type RefObject,
    type SyntheticEvent,
} from 'react';
import {
    Button as DsButton,
    Dialog as DsDialog,
    Heading as DsHeading,
    Paragraph as DsParagraph,
} from '@digdir/designsystemet-react';
import type {
    CratisDialogHost,
    CratisDialogSlotProps,
    DialogParts,
    DialogPlacement,
} from '@cratis/components/Dialogs';
import { classNames } from './classNames.js';

const placements = { center: 'center', start: 'left', end: 'right' } as const satisfies Record<DialogPlacement, string>;

// The element descendant overlays portal into. A fixed, zero-size origin inside the top-layer
// dialog keeps popovers above it, interactive, and free of the dialog's scroll clipping.
const overlayContainerStyle: CSSProperties = { position: 'fixed', top: 0, left: 0, width: 0, height: 0 };

const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'start',
    gap: 'var(--ds-size-2)',
    marginBlockEnd: 'var(--ds-size-4)',
};

const isOutside = (event: MouseEvent<HTMLDialogElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
    );
};

// Unmounting an open modal must still run its close steps, so focus returns to the opener.
const useCloseOnUnmount = (dialogRef: RefObject<HTMLDialogElement | null>) =>
    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        return () => {
            if (dialog?.open) dialog.close();
        };
    }, [dialogRef]);

interface PartAttributes {
    readonly className?: string;
    readonly style?: CSSProperties;
}

// A consumer's `pt` attributes for one part, with its class joined and its style under the part's.
const partAttributes = <T extends PartAttributes>(part: T | undefined, className?: string, style?: CSSProperties) => ({
    ...part,
    className: classNames(className, part?.className) || undefined,
    style: { ...style, ...part?.style },
});

interface HeaderProps {
    readonly title: string;
    readonly subtitle: CratisDialogSlotProps['subtitle'];
    readonly titleId: string;
    readonly isBusy: boolean;
    readonly pt: DialogParts | undefined;
    readonly host: CratisDialogHost;
}

const CloseButton = ({ isBusy, pt, host }: Pick<HeaderProps, 'isBusy' | 'pt' | 'host'>) => (
    <DsButton
        {...partAttributes(pt?.close)}
        type='button'
        variant='tertiary'
        data-color='neutral'
        icon
        aria-label={host.closeAriaLabel}
        data-cratis-part='close'
        data-disabled={isBusy || undefined}
        data-busy={isBusy || undefined}
        disabled={isBusy}
        onClick={() => host.dismiss('closeButton')}
    >
        {host.closeIcon}
    </DsButton>
);

const Header = ({ title, subtitle, titleId, isBusy, pt, host }: HeaderProps) => (
    <header {...partAttributes(pt?.header, undefined, headerStyle)} data-cratis-part='header'>
        <div style={{ flex: 1 }}>
            <DsHeading
                {...partAttributes(pt?.title)}
                level={2}
                data-size='xs'
                id={titleId}
                ref={host.titleRef}
                data-cratis-part='title'
            >
                {title}
            </DsHeading>
            {host.hasSubtitle && (
                <DsParagraph {...partAttributes(pt?.subtitle)} data-size='sm' id={host.subtitleId} data-cratis-part='subtitle'>
                    {subtitle}
                </DsParagraph>
            )}
        </div>
        {host.headerActions}
        {host.dismissal.closeButton && <CloseButton isBusy={isBusy} pt={pt} host={host} />}
    </header>
);

const dialogWidth = (width: CratisDialogSlotProps['width']): CSSProperties =>
    width === undefined ? {} : { width };

// React walks a nested dialog's cancel and click up the component tree; only the target acts.
const isOwnEvent = (event: SyntheticEvent<HTMLDialogElement>) => event.target === event.currentTarget;

const cancelHandler = (host: CratisDialogHost) => (event: SyntheticEvent<HTMLDialogElement>) => {
    if (!isOwnEvent(event)) return;
    event.preventDefault();
    host.dismiss('escape');
};

const isOwnOutsidePress = (event: MouseEvent<HTMLDialogElement>) => isOwnEvent(event) && isOutside(event);

// An outside press dismisses only when it both starts and ends on the backdrop: a press that starts
// inside, such as selecting text in a field, and is released outside keeps the dialog open.
const useOutsidePress = (host: CratisDialogHost) => {
    const startedOutside = useRef(false);
    return {
        onPointerDown: (event: PointerEvent<HTMLDialogElement>) => {
            startedOutside.current = isOwnOutsidePress(event);
        },
        onClick: (event: MouseEvent<HTMLDialogElement>) => {
            const pressedOutside = startedOutside.current && isOwnOutsidePress(event);
            startedOutside.current = false;
            if (pressedOutside) host.dismiss('outside');
        },
    };
};

// A close the platform forced while the dialog should be visible (an Escape it would not let us
// cancel) goes through Components, and the dialog is shown again until Components hides it.
const closeHandler = (host: CratisDialogHost, visible: boolean, dialogRef: RefObject<HTMLDialogElement | null>) => () => {
    const dialog = dialogRef.current;
    if (!visible || !dialog?.isConnected || dialog.open) return;
    host.dismiss('escape');
    dialog.showModal();
};

/**
 * Designsystemet dialog rendered as a native modal `<dialog>` in the browser top layer. The adapter
 * owns the modal shell: the focus trap, Escape, outside press, scroll lock and focus restoration
 * come from the platform. Components keeps the result flow, the footer and header actions, busy
 * and validity, and initial focus through the host; descendant overlays portal into the element
 * registered with the host, so they stay above the dialog.
 */
export const DesignsystemetDialogSlot = ({
    title,
    subtitle,
    placement = 'center',
    visible = true,
    isBusy = false,
    width,
    style,
    className,
    pt,
    host,
}: CratisDialogSlotProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    useCloseOnUnmount(dialogRef);
    const outsidePress = useOutsidePress(host);
    const titleId = `${host.id}-title`;

    return (
        <DsDialog
            {...partAttributes(pt?.root, className)}
            style={{ ...dialogWidth(width), ...pt?.root?.style, ...style }}
            ref={dialogRef}
            open={visible}
            modal
            closeButton={false}
            placement={placements[placement]}
            aria-labelledby={titleId}
            aria-describedby={host.hasSubtitle ? host.subtitleId : undefined}
            aria-busy={isBusy || undefined}
            data-cratis-part='root'
            data-cratis-dialog-id={host.id}
            data-open={visible || undefined}
            data-busy={isBusy || undefined}
            onCancel={cancelHandler(host)}
            onPointerDown={outsidePress.onPointerDown}
            onClick={outsidePress.onClick}
            onClose={closeHandler(host, visible, dialogRef)}
        >
            <Header title={title} subtitle={subtitle} titleId={titleId} isBusy={isBusy} pt={pt} host={host} />
            {host.content}
            {host.footer}
            {host.liveRegion}
            <div data-cratis-overlay-container='' ref={host.registerOverlayContainer} style={overlayContainerStyle} />
        </DsDialog>
    );
};
