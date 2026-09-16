// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import sinon from 'sinon';
import type {} from 'chai/register-should';
import { ErrorBoundary, type ErrorBoundaryProps } from '../../ErrorBoundary';

export function FailingChild({ failure }: { failure: unknown }): ReactNode {
    throw failure;
}

export class a_boundary {
    container: HTMLDivElement;
    root: Root;
    loggedErrors = sinon.stub(console, 'error');
    caughtErrors = sinon.spy();

    constructor() {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        this.container = document.createElement('div');
        document.body.append(this.container);
        this.root = createRoot(this.container, { onCaughtError: this.caughtErrors });
    }

    async render(children: ReactNode, props: Omit<ErrorBoundaryProps, 'children'> = {}) {
        await this.renderTree(<ErrorBoundary {...props}>{children}</ErrorBoundary>);
    }

    async renderTree(children: ReactNode) {
        await act(async () => this.root.render(children));
    }

    async click(label: string) {
        const button = Array.from(this.container.querySelectorAll('button')).find(element => element.textContent === label);
        if (!button) throw new Error(`No button labeled '${label}' was rendered.`);
        await act(async () => button.click());
    }

    async dispose() {
        try {
            await act(async () => this.root.unmount());
        } finally {
            this.container.remove();
            this.loggedErrors.restore();
        }
    }
}
