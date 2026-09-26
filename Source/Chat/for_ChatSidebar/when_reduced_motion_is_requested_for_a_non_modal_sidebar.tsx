// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ChatSidebar } from '../ChatSidebar';

const sidebar = (open: boolean) => (
    <ChatSidebar
        open={open}
        modal={false}
        onClose={() => undefined}
        topics={[]}
        messages={[]}
        onSendMessage={() => undefined}
    />
);

describe('when reduced motion is requested for a non-modal sidebar', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => root.render(sidebar(true)));
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    it('should open without remaining in the entering phase', () => {
        document.querySelector('.cratis-chat-sidebar')!
            .hasAttribute('data-entering').should.equal(false);
    });

    describe('and the host closes it', () => {
        beforeEach(async () => {
            await act(async () => root.render(sidebar(false)));
        });

        it('should unmount without remaining in the exiting phase', () => {
            (document.querySelector('.cratis-chat-sidebar') === null).should.equal(true);
        });
    });
});
