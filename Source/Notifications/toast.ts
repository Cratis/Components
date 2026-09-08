// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';

/**
 * Visual severity level for a toast notification.
 * Determines the default styling and icon treatment when rendered by the Toaster component.
 */
export type ToastSeverity =
    'normal' | 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';

/**
 * Unique identifier for a toast notification.
 * Can be explicitly provided via {@link ToastOptions.id} or auto-generated.
 */
export type ToastId = string | number;

/**
 * Configuration options accepted by every toast notification call.
 * Merged with severity-specific defaults when using helpers like {@link toast.success}.
 */
export interface ToastOptions {
    /** Unique identifier for this toast. Auto-generated if omitted. */
    id?: ToastId;
    /** Primary heading text or element. Rendered prominently in the toast UI. */
    title?: ReactNode | string;
    /** Secondary body text or element. Rendered below the title. */
    description?: ReactNode | string;
    /** Action button props. Rendered as a clickable button in the toast. */
    action?: ButtonHTMLAttributes<HTMLButtonElement>;
    /** Whether the user can manually dismiss the toast. Defaults to true. */
    dismissible?: boolean;
    /** Visual severity level. Determines styling and default icon. */
    severity?: ToastSeverity;
    /** Whether to show a loading spinner. Typically used with {@link toast.promise}. */
    loading?: boolean;
    /** Custom icon element. Overrides the default severity-based icon. */
    icon?: ReactNode;
    /** Custom renderer. Fully replaces the default toast UI when provided. */
    render?: ReactElement;
    /** Auto-dismiss timeout in milliseconds. No auto-dismiss if omitted or zero. */
    duration?: number;
    /** Grouping key. Used to logically associate related toasts. */
    group?: string;
    /** The promise being tracked (internal, set automatically by {@link toast.promise}). */
    promise?: unknown;
    /** Arbitrary metadata. Available to custom renderers and lifecycle callbacks. */
    data?: Record<string, unknown>;
    /** Callback invoked when the toast is dismissed (manually or programmatically). */
    onDismiss?: (toast: ToastOptions) => void;
    /** Callback invoked when the toast auto-dismisses via duration timeout. */
    onTimeout?: (toast: ToastOptions) => void;
}

/**
 * Legacy alias for {@link ToastOptions}.
 * Preserved for source compatibility with earlier versions.
 */
export type ToastType = ToastOptions;

/**
 * Options for {@link toast.promise}, which shows a loading toast and updates it based on promise outcome.
 * @typeParam T - The promise resolution type.
 */
export interface ToastPromiseOptions<T = unknown> {
    /** Toast shown immediately while the promise is pending. Automatically receives `loading: true`. */
    loading: ToastOptions;
    /** Toast shown on success. Can be a static config or a function receiving the resolved value. Returns void to dismiss instead of updating. */
    success?: ToastOptions | ((data: T) => ToastOptions | void);
    /** Toast shown on rejection. Can be a static config or a function receiving the error. Returns void to dismiss instead of updating. */
    error?: ToastOptions | ((error: unknown) => ToastOptions | void);
}

/**
 * Dispatch interface for toast operations.
 * Custom implementations can be installed via {@link setToastDispatch} to intercept all toast calls—
 * useful for testing, logging, or routing toasts to a different rendering surface.
 * The default implementation writes to an in-memory queue consumed by the mounted Toaster component.
 */
export interface ToastDispatch {
    /** Shows a toast with the provided options. Returns the toast ID. */
    show(options: ToastOptions): ToastId;
    /** Updates an existing toast by ID. Returns the toast ID. */
    update(id: ToastId, updates: Partial<ToastOptions>): ToastId;
    /** Dismisses one toast by ID, or all toasts if ID is omitted. */
    dismiss(id?: ToastId): void;
    /** Tracks a promise with loading/success/error toasts. Returns the original promise (passthrough). */
    promise<T>(promise: Promise<T>, options: ToastPromiseOptions<T>): Promise<T>;
    /** Shows a success-severity toast. Shorthand for `show({ ...options, severity: 'success' })`. */
    success(options: ToastOptions): ToastId;
    /** Shows an info-severity toast. Shorthand for `show({ ...options, severity: 'info' })`. */
    info(options: ToastOptions): ToastId;
    /** Shows a warn-severity toast. Shorthand for `show({ ...options, severity: 'warn' })`. */
    warn(options: ToastOptions): ToastId;
    /** Shows an error-severity toast. Shorthand for `show({ ...options, severity: 'error' })`. */
    error(options: ToastOptions): ToastId;
    /** Shows a secondary-severity toast. Shorthand for `show({ ...options, severity: 'secondary' })`. */
    secondary(options: ToastOptions): ToastId;
    /** Shows a contrast-severity toast. Shorthand for `show({ ...options, severity: 'contrast' })`. */
    contrast(options: ToastOptions): ToastId;
}

/**
 * The callable signature and helper methods of the {@link toast} export.
 * All methods delegate to the currently active {@link ToastDispatch} (default queue-backed or custom override).
 */
export interface ToastFunction {
    /** Call signature: shows a toast with the provided options. Equivalent to `toast.show(options)`. */
    (options: ToastOptions): ToastId;
    /** Updates an existing toast by ID. Returns the toast ID. */
    update(id: ToastId, updates: Partial<ToastOptions>): ToastId;
    /** Dismisses one toast by ID, or all toasts if ID is omitted. */
    dismiss(id?: ToastId): void;
    /** Tracks a promise with loading/success/error toasts. Returns the original promise (passthrough). */
    promise<T>(promise: Promise<T>, options: ToastPromiseOptions<T>): Promise<T>;
    /** Shows a success-severity toast. Shorthand for `show({ ...options, severity: 'success' })`. */
    success(options: ToastOptions): ToastId;
    /** Shows an info-severity toast. Shorthand for `show({ ...options, severity: 'info' })`. */
    info(options: ToastOptions): ToastId;
    /** Shows a warn-severity toast. Shorthand for `show({ ...options, severity: 'warn' })`. */
    warn(options: ToastOptions): ToastId;
    /** Shows an error-severity toast. Shorthand for `show({ ...options, severity: 'error' })`. */
    error(options: ToastOptions): ToastId;
    /** Shows a secondary-severity toast. Shorthand for `show({ ...options, severity: 'secondary' })`. */
    secondary(options: ToastOptions): ToastId;
    /** Shows a contrast-severity toast. Shorthand for `show({ ...options, severity: 'contrast' })`. */
    contrast(options: ToastOptions): ToastId;
}

/**
 * The complete shape of a toast notification stored in the global queue.
 * Extends {@link ToastOptions} with a guaranteed `id` property.
 * Custom rendering surfaces can access the queue via {@link subscribeToToasts} and {@link getToastSnapshot}
 * without importing the default Toaster component.
 */
export interface ToastRecord extends ToastOptions {
    /** Unique identifier for this toast. Always present on stored records (auto-generated if not provided). */
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

/**
 * Installs a custom {@link ToastDispatch} implementation that shadows the default queue-backed dispatch.
 * All subsequent `toast(...)` calls route through the provided dispatch until the returned cleanup function is invoked.
 * Dispatch frames are stack-based: nested calls compose, and removing a frame restores the previous one.
 * Useful for testing (intercept/assert toast calls), logging, or routing toasts to an alternative UI.
 *
 * @param dispatch - The custom dispatch implementation to install.
 * @returns A cleanup function that removes this dispatch frame and restores the previous active dispatch.
 *
 * @example
 * ```ts
 * const cleanup = setToastDispatch({
 *   show: (opts) => { console.log('toast:', opts); return 'test-id'; },
 *   // ... other ToastDispatch methods
 * });
 * toast({ title: 'Hello' }); // logs instead of queuing
 * cleanup(); // restores default behavior
 * ```
 */
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
