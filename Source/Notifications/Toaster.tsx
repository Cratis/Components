// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    useEffect,
    useState,
    useSyncExternalStore,
    type ButtonHTMLAttributes,
    type HTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import {
    getToastSnapshot,
    subscribeToToasts,
    toast,
    type ToastRecord,
    type ToastSeverity,
} from './toast';

export type ToasterPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

export interface ToasterPassThrough {
    region?: HTMLAttributes<HTMLDivElement>;
    toast?: HTMLAttributes<HTMLElement>;
    icon?: HTMLAttributes<HTMLSpanElement>;
    content?: HTMLAttributes<HTMLDivElement>;
    title?: HTMLAttributes<HTMLDivElement>;
    description?: HTMLAttributes<HTMLDivElement>;
    close?: ButtonHTMLAttributes<HTMLButtonElement>;
    action?: ButtonHTMLAttributes<HTMLButtonElement>;
}

export interface ToasterProps {
    position?: ToasterPosition;
    limit?: number;
    timeout?: number;
    dismissAriaLabel?: string;
    regionAriaLabel?: string;
    pt?: ToasterPassThrough;
}

const severitySymbol: Record<ToastSeverity, string> = {
    normal: '●',
    success: '✓',
    info: 'ⓘ',
    warn: '⚠',
    error: '⨯',
    secondary: '●',
    contrast: '●',
};

const emptyToasts: ToastRecord[] = [];
const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

interface ToastFrameProps {
    item: ToastRecord;
    timeout: number;
    dismissAriaLabel: string;
    pt?: ToasterPassThrough;
}

const ToastFrame = ({ item, timeout, dismissAriaLabel, pt }: ToastFrameProps) => {
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused || item.loading || item.duration === 0) return;
        const duration = item.duration ?? timeout;
        const timer = window.setTimeout(
            () => {
                item.onTimeout?.(item);
                toast.dismiss(item.id);
            },
            Math.max(duration, 5000),
        );
        return () => window.clearTimeout(timer);
    }, [item, paused, timeout]);

    const severity = item.severity ?? 'normal';
    const content = item.render ?? (
        <>
            {item.title && (
                <div
                    {...pt?.title}
                    className={classNames('cratis-toast__title', pt?.title?.className)}
                    data-cratis-part='title'
                >
                    {item.title}
                </div>
            )}
            {item.description && (
                <div
                    {...pt?.description}
                    className={classNames(
                        'cratis-toast__description',
                        pt?.description?.className,
                    )}
                    data-cratis-part='description'
                >
                    {item.description}
                </div>
            )}
            {item.action && (
                <button
                    {...item.action}
                    {...pt?.action}
                    type='button'
                    className={classNames(
                        'cratis-toast__action',
                        item.action.className,
                        pt?.action?.className,
                    )}
                    data-cratis-part='action'
                />
            )}
        </>
    );

    return (
        <article
            {...pt?.toast}
            className={classNames('cratis-toast', pt?.toast?.className)}
            data-cratis-part='toast'
            data-severity={severity}
            data-loading={item.loading || undefined}
            role={severity === 'error' ? 'alert' : 'status'}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
            }}
        >
            <span
                {...pt?.icon}
                className={classNames('cratis-toast__icon', pt?.icon?.className)}
                data-cratis-part='icon'
                aria-hidden='true'
            >
                {item.loading ? '◌' : (item.icon ?? severitySymbol[severity])}
            </span>
            <div
                {...pt?.content}
                className={classNames('cratis-toast__content', pt?.content?.className)}
                data-cratis-part='content'
            >
                {content}
            </div>
            {item.dismissible !== false && (
                <button
                    {...pt?.close}
                    type='button'
                    className={classNames('cratis-toast__close', pt?.close?.className)}
                    data-cratis-part='close'
                    aria-label={pt?.close?.['aria-label'] ?? dismissAriaLabel}
                    onClick={() => toast.dismiss(item.id)}
                >
                    <span aria-hidden='true'>×</span>
                </button>
            )}
        </article>
    );
};

/** App-wide accessible toast region backed by the Cratis-owned toast queue. */
export const Toaster = ({
    position = 'top-right',
    limit = 3,
    timeout = 6000,
    dismissAriaLabel = 'Dismiss',
    regionAriaLabel = 'Notifications',
    pt,
}: ToasterProps) => {
    const items = useSyncExternalStore(
        subscribeToToasts,
        getToastSnapshot,
        () => emptyToasts,
    );
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            {...pt?.region}
            className={classNames('cratis-toaster', pt?.region?.className)}
            data-cratis-part='region'
            data-position={position}
            role='region'
            aria-label={regionAriaLabel}
            aria-live='polite'
        >
            {items.slice(-limit).map((item) => (
                <ToastFrame
                    key={item.id}
                    item={item}
                    timeout={timeout}
                    dismissAriaLabel={dismissAriaLabel}
                    pt={pt}
                />
            ))}
        </div>,
        document.body,
    );
};
