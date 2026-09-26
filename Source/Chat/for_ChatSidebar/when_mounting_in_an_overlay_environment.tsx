// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { ChatSidebar } from '../ChatSidebar';

describe('when mounting a non-modal sidebar in an overlay environment', () => {
    let container: HTMLDivElement;
    let overlay: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        overlay = document.createElement('div');
        document.body.append(container, overlay);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        overlay.remove();
    });

    describe('and the container is available', () => {
        beforeEach(async () => {
            await act(async () => root.render(
                <CratisComponentsProvider overlayEnvironment={{ getContainer: () => overlay }}>
                    <ChatSidebar open onClose={() => undefined} topics={[]} messages={[]} onSendMessage={() => undefined} />
                </CratisComponentsProvider>,
            ));
        });

        it('should portal into the configured container', () => {
            (overlay.querySelector('.cratis-chat-sidebar') !== null).should.equal(true);
        });
    });

    describe('and the container becomes available on a later render', () => {
        let overlayAvailable = false;
        const overlayEnvironment = { getContainer: () => overlayAvailable ? overlay : null };
        const renderSidebar = () => (
            <CratisComponentsProvider overlayEnvironment={overlayEnvironment}>
                <ChatSidebar open onClose={() => undefined} topics={[]} messages={[]} onSendMessage={() => undefined} />
            </CratisComponentsProvider>
        );

        beforeEach(async () => {
            overlayAvailable = false;
            await act(async () => root.render(renderSidebar()));
            overlayAvailable = true;
            await act(async () => root.render(renderSidebar()));
        });

        it('should portal into the newly available container while open', () => {
            (overlay.querySelector('.cratis-chat-sidebar') !== null).should.equal(true);
        });
    });

    describe('and the container is unavailable', () => {
        beforeEach(async () => {
            await act(async () => root.render(
                <CratisComponentsProvider overlayEnvironment={{ getContainer: () => null }}>
                    <ChatSidebar open onClose={() => undefined} topics={[]} messages={[]} onSendMessage={() => undefined} />
                </CratisComponentsProvider>,
            ));
        });

        it('should defer the portal rather than use document.body', () => {
            (document.querySelector('.cratis-chat-sidebar') === null).should.equal(true);
        });
    });
});
