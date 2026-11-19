// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Fragment, useSyncExternalStore, type CSSProperties, type HTMLAttributes, type PointerEvent } from 'react';
import { Button as PrimeButton } from '@primereact/ui/button';
import {
    DialogBackdrop,
    DialogPopup,
    DialogPortal,
    DialogPositioner,
    DialogRoot,
} from '@primereact/ui/dialog';
import type { CratisDialogHost, CratisDialogSlotProps, DialogParts, DialogPlacement } from '@cratis/components/Dialogs';

type PartAttributes = HTMLAttributes<HTMLElement> & { readonly [attribute: `data-${string}`]: string | number | boolean | undefined };
type Position = 'center' | 'left' | 'right';

const classNames = (...names: readonly (string | undefined)[]) => names.filter(Boolean).join(' ');

const noUnsubscribe = () => undefined;
const subscribeNever = () => noUnsubscribe;

// Server rendering and hydration cannot portal, so the dialog renders in place until the client
// takes over; a client-only render portals from the first pass and never switches.
const useCanPortal = () =>
    useSyncExternalStore(
        subscribeNever,
        () => true,
        () => false,
    );

// The state markers every dialog surface carries while the dialog is open or busy.
const stateMarkers = (part: string, visible: boolean, isBusy: boolean) => ({
    'data-cratis-part': part,
    'data-open': visible || undefined,
    'data-busy': isBusy || undefined,
});

// The element descendant overlays portal into. A fixed, zero-size origin inside the dialog keeps
// popovers and tooltips stacked above it, interactive, and free of the dialog's scroll clipping.
const overlayContainerStyle: CSSProperties = { position: 'fixed', top: 0, left: 0, width: 0, height: 0 };

const headerStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 8 };

const positions: Record<DialogPlacement, Position> = { center: 'center', start: 'left', end: 'right' };

const popupStyle = (placement: DialogPlacement, width: string | undefined): CSSProperties => ({
    width: width ?? '450px',
    maxWidth: 'calc(100% - 2rem)',
    ...(placement === 'center' ? {} : { height: '100%', maxHeight: 'none', borderRadius: 0 }),
});

// A consumer's `pt` attributes for one part, with its class joined and its style over the part's.
const part = <T extends PartAttributes>(attributes: T | undefined, className?: string, style?: CSSProperties) => ({
    ...attributes,
    className: classNames(className, attributes?.className) || undefined,
    style: { ...style, ...attributes?.style },
});

// A press outside the dialog counts only when it both starts and ends on the same backdrop or
// positioner element, so a drag that began inside the dialog never dismisses it.
const outsidePress = (host: CratisDialogHost) => {
    let pressed: EventTarget | null = null;
    return {
        onPointerDown: (event: PointerEvent) => {
            pressed = event.target;
        },
        onPointerUp: (event: PointerEvent) => {
            if (pressed === event.target && event.target === event.currentTarget) host.dismiss('outside');
            pressed = null;
        },
    };
};

interface HeaderProps {
    readonly title: string;
    readonly subtitle: CratisDialogSlotProps['subtitle'];
    readonly titleId: string;
    readonly isBusy: boolean;
    readonly pt: DialogParts | undefined;
    readonly host: CratisDialogHost;
}

const CloseButton = ({ isBusy, pt, host }: Pick<HeaderProps, 'isBusy' | 'pt' | 'host'>) => (
    <PrimeButton
        {...pt?.close}
        as='button'
        variant='text'
        size='small'
        type='button'
        aria-label={host.closeAriaLabel}
        data-cratis-part='close'
        data-disabled={isBusy || undefined}
        data-busy={isBusy || undefined}
        disabled={isBusy}
        onClick={() => host.dismiss('closeButton')}
    >
        {host.closeIcon}
    </PrimeButton>
);

const Header = ({ title, subtitle, titleId, isBusy, pt, host }: HeaderProps) => (
    <header {...part(pt?.header, undefined, headerStyle)} data-cratis-part='header'>
        <div style={{ flex: 1 }}>
            <h2 {...part(pt?.title)} id={titleId} ref={host.titleRef} data-cratis-part='title'>
                {title}
            </h2>
            {host.hasSubtitle && (
                <p {...part(pt?.subtitle)} id={host.subtitleId} data-cratis-part='subtitle'>
                    {subtitle}
                </p>
            )}
        </div>
        {host.headerActions}
        {host.dismissal.closeButton && <CloseButton isBusy={isBusy} pt={pt} host={host} />}
    </header>
);

/**
 * PrimeReact 11 implementation of the atomic `dialogs.dialog` slot. PrimeReact owns the modal shell:
 * the focus trap, Escape, scroll lock and focus restoration. Components keeps the result flow, footer
 * and header actions, busy and validity, and initial focus through the host. Escape is the only
 * dismissal PrimeReact reports, because the pointer and close-button paths are reported by this slot.
 */
export const PrimeDialogSlot = ({
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
    const titleId = `${host.id}-title`;
    const Shell = useCanPortal() ? DialogPortal : Fragment;
    const backdropPress = outsidePress(host);
    const positionerPress = outsidePress(host);
    return (
        <DialogRoot
            open={visible}
            position={positions[placement]}
            dismissable={false}
            autoZIndex={false}
            onOpenChange={(event: { readonly value?: boolean }) => {
                if (!event.value) host.dismiss('escape');
            }}
        >
            <Shell>
                <DialogBackdrop
                    {...part(pt?.backdrop, undefined, { zIndex: host.zIndex })}
                    {...stateMarkers('backdrop', visible, isBusy)}
                    {...backdropPress}
                />
                <DialogPositioner
                    {...part(pt?.positioner, undefined, { zIndex: host.zIndex })}
                    {...stateMarkers('positioner', visible, isBusy)}
                    {...positionerPress}
                >
                    <DialogPopup
                        {...part(pt?.root, className, { ...popupStyle(placement, width), ...style })}
                        {...stateMarkers('root', visible, isBusy)}
                        as='section'
                        aria-labelledby={titleId}
                        aria-describedby={host.hasSubtitle ? host.subtitleId : undefined}
                        aria-busy={isBusy || undefined}
                        data-cratis-dialog-id={host.id}
                    >
                        <Header title={title} subtitle={subtitle} titleId={titleId} isBusy={isBusy} pt={pt} host={host} />
                        {host.content}
                        {host.footer}
                        {host.liveRegion}
                        <div data-cratis-overlay-container='' ref={host.registerOverlayContainer} style={overlayContainerStyle} />
                    </DialogPopup>
                </DialogPositioner>
            </Shell>
        </DialogRoot>
    );
};
