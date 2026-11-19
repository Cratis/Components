// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useSyncExternalStore, type CSSProperties, type HTMLAttributes } from 'react';
import MuiDialog from '@mui/material/Dialog';
import MuiIconButton from '@mui/material/IconButton';
import MuiTypography from '@mui/material/Typography';
import type { CratisDialogHost, CratisDialogSlotProps, DialogParts, DialogPlacement } from '@cratis/components/Dialogs';
import { useEscapeFromAnywhere } from './dialogEscape.js';

type PartAttributes = HTMLAttributes<HTMLElement> & { readonly [attribute: `data-${string}`]: string | number | boolean | undefined };

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

const headerStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '16px 24px 8px' };

const sheetAlignment: Record<DialogPlacement, CSSProperties> = {
    center: {},
    start: { justifyContent: 'flex-start' },
    end: { justifyContent: 'flex-end' },
};

const paperStyle = (placement: DialogPlacement, width: string | undefined): CSSProperties => ({
    width: width ?? '450px',
    maxWidth: 'calc(100% - 2rem)',
    ...(placement === 'center' ? {} : { margin: 0, height: '100%', maxHeight: 'none', borderRadius: 0 }),
});

// A consumer's `pt` attributes for one part, with its class joined and its style over the part's.
const part = <T extends PartAttributes>(attributes: T | undefined, className?: string, style?: CSSProperties) => ({
    ...attributes,
    className: classNames(className, attributes?.className) || undefined,
    style: { ...style, ...attributes?.style },
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
    <MuiIconButton
        {...pt?.close}
        color='default'
        type='button'
        size='small'
        aria-label={host.closeAriaLabel}
        data-cratis-part='close'
        data-disabled={isBusy || undefined}
        data-busy={isBusy || undefined}
        disabled={isBusy}
        onClick={() => host.dismiss('closeButton')}
    >
        {host.closeIcon}
    </MuiIconButton>
);

const Header = ({ title, subtitle, titleId, isBusy, pt, host }: HeaderProps) => (
    <header {...part(pt?.header, undefined, headerStyle)} data-cratis-part='header'>
        <div style={{ flex: 1 }}>
            <MuiTypography
                {...part(pt?.title)}
                variant='h6'
                component='h2'
                id={titleId}
                ref={host.titleRef}
                data-cratis-part='title'
            >
                {title}
            </MuiTypography>
            {host.hasSubtitle && (
                <MuiTypography
                    {...part(pt?.subtitle)}
                    variant='body2'
                    color='text.secondary'
                    id={host.subtitleId}
                    data-cratis-part='subtitle'
                >
                    {subtitle}
                </MuiTypography>
            )}
        </div>
        {host.headerActions}
        {host.dismissal.closeButton && <CloseButton isBusy={isBusy} pt={pt} host={host} />}
    </header>
);

/**
 * Material UI implementation of the atomic `dialogs.dialog` slot. Material UI owns the modal shell:
 * the focus trap, Escape and backdrop dismissal, scroll lock and focus restoration. Components keeps
 * the result flow, footer and header actions, busy and validity, and initial focus through the host;
 * descendant overlays portal into the element registered with the host, so they stay above the dialog.
 */
export const MuiDialogSlot = ({
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
    const canPortal = useCanPortal();
    useEscapeFromAnywhere(visible, () => host.dismiss('escape'));
    const rootProps = {
        ...part(pt?.root, className, { ...paperStyle(placement, width), ...style }),
        ...stateMarkers('root', visible, isBusy),
        component: 'section' as const,
        'aria-busy': isBusy || undefined,
        'data-cratis-dialog-id': host.id,
    };
    const backdropProps = { ...part(pt?.backdrop), ...stateMarkers('backdrop', visible, isBusy) };
    const positionerProps = {
        ...part(pt?.positioner, undefined, sheetAlignment[placement]),
        ...stateMarkers('positioner', visible, isBusy),
    };
    return (
        <MuiDialog
            open={visible}
            role='dialog'
            maxWidth={false}
            disablePortal={!canPortal}
            aria-labelledby={titleId}
            aria-describedby={host.hasSubtitle ? host.subtitleId : undefined}
            style={{ zIndex: host.zIndex }}
            onClose={(_event, reason) => host.dismiss(reason === 'escapeKeyDown' ? 'escape' : 'outside')}
            slotProps={{
                backdrop: backdropProps,
                container: positionerProps,
                paper: rootProps,
            }}
        >
            <Header title={title} subtitle={subtitle} titleId={titleId} isBusy={isBusy} pt={pt} host={host} />
            {host.content}
            {host.footer}
            {host.liveRegion}
            <div data-cratis-overlay-container='' ref={host.registerOverlayContainer} style={overlayContainerStyle} />
        </MuiDialog>
    );
};
