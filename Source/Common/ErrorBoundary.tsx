// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Props for {@link ErrorBoundary}.
 */
interface Props {
    /** The subtree the boundary protects. Rendered as-is when no error is caught. */
    children: ReactNode;
}

/**
 * Internal state captured when a child throws during render or commit.
 */
interface State {
    /** True once a child has thrown; switches the render path to the fallback UI. */
    hasError: boolean;
    /** The thrown error. Held so the fallback UI can show message and stack. */
    error: Error;
}

/**
 * React error boundary that catches errors thrown by its descendants during
 * render, lifecycle, and constructor calls. On error, it renders a minimal
 * inline diagnostic (message + stack) so the rest of the application keeps
 * working instead of crashing the whole tree.
 *
 * Wrap the boundary around any subtree whose failure should be isolated:
 *
 * ```tsx
 * <ErrorBoundary>
 *     <RiskyFeature />
 * </ErrorBoundary>
 * ```
 *
 * Use one boundary per logical UI region rather than a single root-level one,
 * so failures stay scoped to the feature that caused them.
 */
export class ErrorBoundary extends Component<Props, State> {
    /** Initial state — no error captured. */
    public state: State = {
        hasError: false,
        error: new Error(),
    };

    /**
     * React lifecycle hook invoked when a descendant throws. Returns the
     * next state, which switches the boundary into its fallback render path.
     *
     * @param error - The error thrown by the descendant.
     */
    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error: error };
    }

    /**
     * React lifecycle hook invoked alongside {@link getDerivedStateFromError}.
     * Forwards the error and React's component stack to the console so the
     * failure is observable in DevTools.
     *
     * @param error - The error thrown by the descendant.
     * @param errorInfo - React-supplied metadata including the component stack.
     */
    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className='p-4'>
                    <h1 className='text-3xl m-3'>Error</h1>
                    <p>{this.state.error.message}</p>
                    <p>{this.state.error.stack}</p>
                </div>
            );
        }

        return this.props.children;
    }
}
