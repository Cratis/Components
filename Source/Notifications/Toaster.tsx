// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo } from 'react';
import { Toaster as PrimeToaster, useToasterContext } from 'primereact/toaster';
import { Toast } from 'primereact/toast';
import type { ToastRootProps } from '@primereact/types/primitive/toast';
import type { ToasterRegionProps, ToastType } from '@primereact/types/primitive/toaster';
import type { ToasterPosition } from '@primereact/types/headless/toaster';

/**
 * Reads the live toasts from the toaster context and renders each one. Must be
 * mounted inside `PrimeToaster.Root` (which provides the context). The
 * imperative `toast(...)` calls push into the same module-level store this
 * subscribes to, so a single mounted region shows toasts from anywhere.
 */
interface FramedToastProps {
    item: ToastType;
    dismissAriaLabel: string;
    pt?: ToastRootProps['pt'];
}

const FramedToast = ({ item, dismissAriaLabel, pt }: FramedToastProps) => {
    const customBody = item.render;
    const framedToast = useMemo<ToastType>(
        () => ({
            ...item,
            render: undefined,
            onDismiss: item.onDismiss ? () => item.onDismiss?.(item) : undefined,
            onTimeout: item.onTimeout ? () => item.onTimeout?.(item) : undefined,
        }),
        [item],
    );

    return (
        <Toast.Root
            toast={framedToast}
            data-severity={item.severity}
            className='cratis-toast'
            pt={pt}
        >
            <Toast.Icon match='success'>
                <i className='pi pi-check-circle' />
            </Toast.Icon>
            <Toast.Icon match='info'>
                <i className='pi pi-info-circle' />
            </Toast.Icon>
            <Toast.Icon match='warn'>
                <i className='pi pi-exclamation-triangle' />
            </Toast.Icon>
            <Toast.Icon match='error'>
                <i className='pi pi-times-circle' />
            </Toast.Icon>
            <Toast.Icon>
                <i className='pi pi-bell' />
            </Toast.Icon>
            <Toast.Content>
                {customBody ?? (
                    <>
                        <Toast.Title />
                        <Toast.Description />
                    </>
                )}
            </Toast.Content>
            <Toast.Close aria-label={dismissAriaLabel}>
                <i className='pi pi-times' />
            </Toast.Close>
        </Toast.Root>
    );
};

interface ToastListProps {
    dismissAriaLabel: string;
    pt?: ToastRootProps['pt'];
}

const ToastList = ({ dismissAriaLabel, pt }: ToastListProps) => {
    const toaster = useToasterContext();
    if (!toaster) return null;

    return (
        <>
            {toaster.toasts.map((item: ToastType) => (
                <FramedToast
                    key={item.id}
                    item={item}
                    dismissAriaLabel={dismissAriaLabel}
                    pt={pt}
                />
            ))}
        </>
    );
};

/** Pass-through configuration for the toaster region and each toast frame. */
export interface ToasterPassThrough {
    /** Pass-through configuration for the app-wide toaster region. */
    region?: ToasterRegionProps['pt'];
    /** Pass-through configuration applied to every toast frame. */
    toast?: ToastRootProps['pt'];
}

/** Props for {@link Toaster}. */
export interface ToasterProps {
    /** Corner/edge the toasts stack from. Defaults to `'top-right'`. */
    position?: ToasterPosition;
    /** Maximum number of toasts shown at once. Defaults to `3`. */
    limit?: number;
    /** Auto-dismiss timeout in milliseconds. Defaults to `6000`. Per-toast `duration` overrides it. */
    timeout?: number;
    /** Accessible name for each toast's dismiss button. Override to localize. Defaults to `'Dismiss'`. */
    dismissAriaLabel?: string;
    /** Pass-through configuration for the region and each toast frame. */
    pt?: ToasterPassThrough;
}

/**
 * The single, app-wide toast host. Mount one `<Toaster />` near your app root;
 * then call the imperative {@link toast} (`toast.success(...)`, `toast.error(...)`,
 * …) from anywhere — including outside React — and the notification appears
 * here and auto-dismisses.
 *
 * Built on PrimeReact 11's headless Toaster/Toast: a module-level store backs
 * the imperative API, and this region subscribes to it. Icons are chosen per
 * severity, close/dismiss and the auto-dismiss timer are wired by the
 * primitives, and severity is surfaced as `data-severity` on each toast for
 * styling. A toast's custom `render` element replaces only the content body;
 * the severity icon and dismiss control remain in the Components-owned frame.
 *
 * ```tsx
 * // once, near the app root:
 * <Toaster position="top-right" />
 *
 * // anywhere:
 * import { toast } from '@cratis/components/Notifications';
 * toast.success({ title: 'Saved', description: 'Your changes were saved.' });
 * ```
 *
 * To surface an Arc command result automatically, see {@link toastCommandResult}.
 */
export const Toaster = ({
    position = 'top-right',
    limit = 3,
    timeout = 6000,
    dismissAriaLabel = 'Dismiss',
    pt,
}: ToasterProps) => (
    <PrimeToaster.Root position={position} limit={limit} timeout={timeout}>
        <PrimeToaster.Portal>
            <PrimeToaster.Region pt={pt?.region}>
                <ToastList dismissAriaLabel={dismissAriaLabel} pt={pt?.toast} />
            </PrimeToaster.Region>
        </PrimeToaster.Portal>
    </PrimeToaster.Root>
);
