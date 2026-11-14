// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ChatSidebar } from '../ChatSidebar';

const sidebar = (modal: boolean) => (
    <ChatSidebar
        open={false}
        modal={modal}
        onClose={() => undefined}
        topics={[]}
        messages={[]}
        onSendMessage={() => undefined}
    />
);

describe('when a sidebar is closed on first render', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should render no non-modal sidebar DOM', async () => {
        await act(async () => root.render(sidebar(false)));
        (document.querySelector('.cratis-chat-sidebar__backdrop') === null).should.be.true;
        container.innerHTML.should.equal('');
    });

    it('should render no modal sidebar DOM', async () => {
        await act(async () => root.render(sidebar(true)));
        (document.querySelector('.cratis-chat-sidebar') === null).should.be.true;
        container.innerHTML.should.equal('');
    });
});
