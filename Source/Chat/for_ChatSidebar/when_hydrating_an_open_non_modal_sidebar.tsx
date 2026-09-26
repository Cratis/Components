// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { vi } from 'vitest';
import { ChatSidebar } from '../ChatSidebar';

describe('when hydrating an open non-modal sidebar', () => {
    let container: HTMLDivElement;
    let root: Root;
    let hydrationErrors: string[];

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        hydrationErrors = [];
        const originalConsoleError = console.error;
        vi.spyOn(console, 'error').mockImplementation((...values: unknown[]) => {
            const message = values.map(String).join(' ');
            if (/hydration|did not match|server rendered/i.test(message)) {
                hydrationErrors.push(message);
            } else {
                originalConsoleError(...values);
            }
        });
        const element = (
            <ChatSidebar open onClose={() => undefined} topics={[]} messages={[]} onSendMessage={() => undefined} />
        );
        container = document.createElement('div');
        container.innerHTML = renderToString(element);
        document.body.append(container);
        await act(async () => {
            root = hydrateRoot(container, element);
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.restoreAllMocks();
    });

    it('should portal the panel without a hydration mismatch', () => {
        hydrationErrors.should.deep.equal([]);
        (document.querySelector('.cratis-chat-sidebar') !== null).should.equal(true);
    });
});
