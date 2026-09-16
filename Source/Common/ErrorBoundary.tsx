// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Props for {@link ErrorBoundary}. */
export interface ErrorBoundaryProps {
    /** The subtree to protect. Rendered unchanged until a descendant fails. */
    children: ReactNode;
    /**
     * Replaces the default message and retry button. A render callback receives only a reset
     * action, not error diagnostics. Use it for localized content and application-specific
     * recovery. An explicit `null` renders nothing; omission uses the default fallback.
     */
    fallback?: ReactNode | ((reset: () => void) => ReactNode);
    /**
     * Receives the thrown value and React component stack for application-controlled reporting.
     * Replaces this boundary's default console reporter, but not React's own error reporting.
     * Diagnostics may contain sensitive data; do not display them in the fallback.
     */
    onError?: (error: unknown, errorInfo: ErrorInfo) => void;
    /**
     * Runs synchronously before a user-requested retry so the host can clear the cause of the
     * failure. Retry remounts only this boundary's children; it does not reload the page.
     */
    onReset?: () => void;
}

/** Internal render state for the boundary; error diagnostics never enter its fallback state. */
interface State {
    /** Whether to show the fallback instead of the protected subtree. */
    hasError: boolean;
}

/**
 * Isolates descendant render/lifecycle errors behind a safe message and a user-triggered retry.
 * The default fallback never displays the thrown value or its stack. Diagnostics go to
 * {@link ErrorBoundaryProps.onError}, or the console when no reporter is supplied.
 *
 * Retry remounts children, discarding their local state but preserving the surrounding app.
 * A persistent failure returns to the fallback; there is no automatic retry loop. Errors in
 * event handlers, asynchronous work, server rendering, or this boundary itself are not caught.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *     <RiskyFeature />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
    /** Starts with the protected content visible. */
    public state: State = { hasError: false };

    /**
     * Switches to the fallback without inspecting or retaining the thrown value.
     * @param _error - The value thrown by a descendant, which need not be an Error instance.
     * @returns The render state used for the safe fallback.
     */
    public static getDerivedStateFromError(_error: unknown): State {
        return { hasError: true };
    }

    /**
     * Reports a caught failure without placing diagnostics in the rendered markup.
     * @param error - The value thrown by a descendant.
     * @param errorInfo - React's component stack information.
     */
    public componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        } else {
            console.error('Uncaught error:', error, errorInfo);
        }
    }

    private reset = () => {
        if (!this.state.hasError) return;
        this.props.onReset?.();
        this.setState({ hasError: false });
    };

    /**
     * Renders the children or the safe recovery UI. Native fallback markup deliberately avoids
     * depending on a renderer/provider that may itself have caused the descendant failure.
     * @returns The protected content or the configured fallback.
     */
    public render() {
        if (!this.state.hasError) return this.props.children;

        const { fallback } = this.props;
        if (typeof fallback === 'function') return fallback(this.reset);
        if (fallback !== undefined) return fallback;

        return (
            <div className='cratis:p-4' role='alert'>
                <p>Something went wrong. Please try again.</p>
                <button type='button' className='cratis-button' onClick={this.reset}>
                    Try again
                </button>
            </div>
        );
    }
}
