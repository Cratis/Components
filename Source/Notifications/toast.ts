// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';

export type ToastSeverity =
    'normal' | 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';
export type ToastId = string | number;

export interface ToastOptions {
    id?: ToastId;
    title?: ReactNode | string;
    description?: ReactNode | string;
    action?: ButtonHTMLAttributes<HTMLButtonElement>;
    dismissible?: boolean;
    severity?: ToastSeverity;
    loading?: boolean;
    icon?: ReactNode;
    render?: ReactElement;
    duration?: number;
    group?: string;
    promise?: unknown;
    data?: Record<string, unknown>;
    onDismiss?: (toast: ToastOptions) => void;
    onTimeout?: (toast: ToastOptions) => void;
}

export type ToastType = ToastOptions;

export interface ToastPromiseOptions<T = unknown> {
    loading: ToastOptions;
    success?: ToastOptions | ((data: T) => ToastOptions | void);
    error?: ToastOptions | ((error: unknown) => ToastOptions | void);
}

export interface ToastDispatch {
    show(options: ToastOptions): ToastId;
    update(id: ToastId, updates: Partial<ToastOptions>): ToastId;
    dismiss(id?: ToastId): void;
    promise<T>(promise: Promise<T>, options: ToastPromiseOptions<T>): Promise<T>;
    success(options: ToastOptions): ToastId;
    info(options: ToastOptions): ToastId;
    warn(options: ToastOptions): ToastId;
    error(options: ToastOptions): ToastId;
    secondary(options: ToastOptions): ToastId;
    contrast(options: ToastOptions): ToastId;
}

export interface ToastFunction {
    (options: ToastOptions): ToastId;
    update(id: ToastId, updates: Partial<ToastOptions>): ToastId;
    dismiss(id?: ToastId): void;
    promise<T>(promise: Promise<T>, options: ToastPromiseOptions<T>): Promise<T>;
    success(options: ToastOptions): ToastId;
    info(options: ToastOptions): ToastId;
    warn(options: ToastOptions): ToastId;
    error(options: ToastOptions): ToastId;
    secondary(options: ToastOptions): ToastId;
    contrast(options: ToastOptions): ToastId;
}

export interface ToastRecord extends ToastOptions {
    id: ToastId;
}

interface ToastStore {
    items: ToastRecord[];
    listeners: Set<() => void>;
    nextId: number;
}

const storeKey = Symbol.for('@cratis/components/toast-store/v1');
// SAFETY: Symbol.for lets multiple loaded Components copies share one app-wide queue.
const storeHost = globalThis as unknown as Record<symbol, ToastStore | undefined>;
const store = (storeHost[storeKey] ??= { items: [], listeners: new Set(), nextId: 1 });
const emit = () => store.listeners.forEach((listener) => listener());

/** Subscribes a mounted toaster to the app-wide queue. */
export const subscribeToToasts = (listener: () => void): (() => void) => {
    store.listeners.add(listener);
    return () => store.listeners.delete(listener);
};

/** Returns the current immutable queue snapshot. */
export const getToastSnapshot = (): ToastRecord[] => store.items;

const show = (options: ToastOptions): ToastId => {
    const id = options.id ?? store.nextId++;
    const record = { ...options, id };
    const existing = store.items.findIndex((item) => item.id === id);
    store.items =
        existing >= 0
            ? store.items.map((item) => (item.id === id ? record : item))
            : [...store.items, record];
    emit();
    return id;
};

const update = (id: ToastId, updates: Partial<ToastOptions>): ToastId => {
    store.items = store.items.map((item) =>
        item.id === id ? { ...item, ...updates, id } : item,
    );
    emit();
    return id;
};

const dismiss = (id?: ToastId) => {
    const removed =
        id === undefined ? store.items : store.items.filter((item) => item.id === id);
    removed.forEach((item) => item.onDismiss?.(item));
    store.items = id === undefined ? [] : store.items.filter((item) => item.id !== id);
    emit();
};

const promise = async <T>(
    work: Promise<T>,
    options: ToastPromiseOptions<T>,
): Promise<T> => {
    const id = show({ ...options.loading, loading: true });
    try {
        const data = await work;
        const resolved =
            typeof options.success === 'function'
                ? options.success(data)
                : options.success;
        if (resolved) update(id, { ...resolved, loading: false });
        else dismiss(id);
        return data;
    } catch (error) {
        const resolved =
            typeof options.error === 'function' ? options.error(error) : options.error;
        if (resolved) update(id, { ...resolved, loading: false });
        else dismiss(id);
        throw error;
    }
};

const withSeverity = (severity: ToastSeverity) => (options: ToastOptions) =>
    show({ ...options, severity });

const defaultToastDispatch: ToastDispatch = {
    show,
    update,
    dismiss,
    promise,
    success: withSeverity('success'),
    info: withSeverity('info'),
    warn: withSeverity('warn'),
    error: withSeverity('error'),
    secondary: withSeverity('secondary'),
    contrast: withSeverity('contrast'),
};

interface ToastDispatchFrame {
    dispatch: ToastDispatch;
    previous?: ToastDispatchFrame;
    removed: boolean;
}

interface ToastDispatchRegistry {
    active?: ToastDispatchFrame;
}

const dispatchRegistryKey = Symbol.for('@cratis/components/toast-dispatch/v1');
// SAFETY: Symbol.for gives every loaded Components copy the same isolated dispatch slot.
const dispatchHost = globalThis as unknown as Record<
    symbol,
    ToastDispatchRegistry | undefined
>;
const dispatchRegistry = (dispatchHost[dispatchRegistryKey] ??= {});

const nearestActiveFrame = (
    frame: ToastDispatchFrame | undefined,
): ToastDispatchFrame | undefined => {
    let current = frame;
    while (current?.removed) current = current.previous;
    return current;
};

export const setToastDispatch = (dispatch: ToastDispatch): (() => void) => {
    const frame: ToastDispatchFrame = {
        dispatch,
        previous: dispatchRegistry.active,
        removed: false,
    };
    dispatchRegistry.active = frame;

    return () => {
        if (frame.removed) return;
        frame.removed = true;
        if (dispatchRegistry.active === frame) {
            dispatchRegistry.active = nearestActiveFrame(frame.previous);
        }
    };
};

const activeToastDispatch = () =>
    nearestActiveFrame(dispatchRegistry.active)?.dispatch ?? defaultToastDispatch;

const callableToast = ((options: ToastOptions) =>
    activeToastDispatch().show(options)) as ToastFunction;
callableToast.update = (id, updates) => activeToastDispatch().update(id, updates);
callableToast.dismiss = (id) => activeToastDispatch().dismiss(id);
callableToast.promise = (work, options) => activeToastDispatch().promise(work, options);
callableToast.success = (options) => activeToastDispatch().success(options);
callableToast.info = (options) => activeToastDispatch().info(options);
callableToast.warn = (options) => activeToastDispatch().warn(options);
callableToast.error = (options) => activeToastDispatch().error(options);
callableToast.secondary = (options) => activeToastDispatch().secondary(options);
callableToast.contrast = (options) => activeToastDispatch().contrast(options);

/** Cratis-owned imperative toast API. Mount one {@link Toaster} in the application root. */
export const toast: ToastFunction = callableToast;
