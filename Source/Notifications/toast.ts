// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';
import { toast as primeReactToast } from 'primereact/toaster';
import type {
    ToastPromiseType as PrimeReactToastPromiseType,
    ToastType as PrimeReactToastType,
} from '@primereact/types/primitive/toaster';

/** Severity understood by the Cratis toast dispatch. */
export type ToastSeverity =
    'normal' | 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';

/** Identifier returned by the toast dispatch. */
export type ToastId = string | number;

/** Cratis-owned toast options, independent of the active renderer. */
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

/** Backward-compatible name for {@link ToastOptions}. */
export type ToastType = ToastOptions;

/** Toast states used while tracking a promise. */
export interface ToastPromiseOptions<T = unknown> {
    loading: ToastOptions;
    success?: ToastOptions | ((data: T) => ToastOptions | void);
    error?: ToastOptions | ((error: unknown) => ToastOptions | void);
}

/** Renderer-independent toast dispatch contract. */
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

/** Callable Cratis toast API exposed to applications. */
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

const toPrimeReactToast = (options: ToastOptions): PrimeReactToastType => {
    // SAFETY: ToastOptions intentionally mirrors the renderer's value shape while
    // keeping all public names owned by Cratis.
    return options as PrimeReactToastType;
};

const toPrimeReactPromise = <T>(
    options: ToastPromiseOptions<T>,
): PrimeReactToastPromiseType<T> => {
    const success = options.success;
    const error = options.error;

    return {
        loading: toPrimeReactToast(options.loading),
        success:
            typeof success === 'function'
                ? (data) => {
                      const resolved = success(data);
                      return resolved ? toPrimeReactToast(resolved) : undefined;
                  }
                : success
                  ? toPrimeReactToast(success)
                  : undefined,
        error:
            typeof error === 'function'
                ? (failure) => {
                      const resolved = error(failure);
                      return resolved ? toPrimeReactToast(resolved) : undefined;
                  }
                : error
                  ? toPrimeReactToast(error)
                  : undefined,
    };
};

const primeReactToastDispatch: ToastDispatch = {
    show: (options) => primeReactToast(toPrimeReactToast(options)),
    update: (id, updates) => primeReactToast.update(id, toPrimeReactToast(updates)),
    dismiss: (id) => primeReactToast.dismiss(id),
    promise: (promise, options) =>
        primeReactToast.promise(promise, toPrimeReactPromise(options)),
    success: (options) => primeReactToast.success(toPrimeReactToast(options)),
    info: (options) => primeReactToast.info(toPrimeReactToast(options)),
    warn: (options) => primeReactToast.warn(toPrimeReactToast(options)),
    error: (options) => primeReactToast.error(toPrimeReactToast(options)),
    secondary: (options) => primeReactToast.secondary(toPrimeReactToast(options)),
    contrast: (options) => primeReactToast.contrast(toPrimeReactToast(options)),
};

interface ToastDispatchFrame {
    dispatch: ToastDispatch;
    previous?: ToastDispatchFrame;
    removed: boolean;
}

const defaultToastDispatchFrame: ToastDispatchFrame = {
    dispatch: primeReactToastDispatch,
    removed: false,
};
let activeToastDispatchFrame = defaultToastDispatchFrame;

const nearestActiveFrame = (
    frame: ToastDispatchFrame | undefined,
): ToastDispatchFrame => {
    let current = frame;
    while (current?.removed) current = current.previous;
    return current ?? defaultToastDispatchFrame;
};

/**
 * Replaces the active toast renderer and returns a scoped restore callback.
 * Applications normally use the default PrimeReact implementation.
 */
export const setToastDispatch = (dispatch: ToastDispatch): (() => void) => {
    const frame: ToastDispatchFrame = {
        dispatch,
        previous: activeToastDispatchFrame,
        removed: false,
    };
    activeToastDispatchFrame = frame;

    return () => {
        if (frame.removed) return;
        frame.removed = true;
        if (activeToastDispatchFrame === frame) {
            activeToastDispatchFrame = nearestActiveFrame(frame.previous);
        }
    };
};

const activeToastDispatch = () => nearestActiveFrame(activeToastDispatchFrame).dispatch;

const callableToast = ((options: ToastOptions) =>
    activeToastDispatch().show(options)) as ToastFunction;
callableToast.update = (id, updates) => activeToastDispatch().update(id, updates);
callableToast.dismiss = (id) => activeToastDispatch().dismiss(id);
callableToast.promise = (promise, options) =>
    activeToastDispatch().promise(promise, options);
callableToast.success = (options) => activeToastDispatch().success(options);
callableToast.info = (options) => activeToastDispatch().info(options);
callableToast.warn = (options) => activeToastDispatch().warn(options);
callableToast.error = (options) => activeToastDispatch().error(options);
callableToast.secondary = (options) => activeToastDispatch().secondary(options);
callableToast.contrast = (options) => activeToastDispatch().contrast(options);

/**
 * Cratis-owned imperative toast API. Requires a {@link Toaster} for the default
 * renderer, or a custom dispatch installed through {@link setToastDispatch}.
 */
export const toast: ToastFunction = callableToast;
