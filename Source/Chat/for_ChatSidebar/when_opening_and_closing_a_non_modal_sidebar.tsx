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

describe('when opening and closing a non-modal sidebar', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        vi.useFakeTimers();
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => root.render(sidebar(true)));
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.useRealTimers();
    });

    it('should enter after mounting', () => {
        document.querySelector('.cratis-chat-sidebar')!
            .hasAttribute('data-entering').should.equal(true);
    });

    describe('and the host closes it', () => {
        beforeEach(async () => {
            await act(async () => root.render(sidebar(false)));
        });

        it('should remain mounted while exiting', () => {
            document.querySelector('.cratis-chat-sidebar')!
                .hasAttribute('data-exiting').should.equal(true);
        });

        describe('and the exit animation ends', () => {
            beforeEach(async () => {
                await act(async () => {
                    document.querySelector('.cratis-chat-sidebar')!
                        // React uses the prefixed event in jsdom, which has no AnimationEvent.
                        .dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }));
                });
            });

            it('should unmount the panel', () => {
                (document.querySelector('.cratis-chat-sidebar') === null).should.equal(true);
            });
        });

        describe('and a child animation ends', () => {
            beforeEach(async () => {
                await act(async () => {
                    document.querySelector('.cratis-chat-sidebar__header')!
                        .dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }));
                });
            });

            it('should keep the panel until its own animation ends', () => {
                document.querySelector('.cratis-chat-sidebar')!
                    .hasAttribute('data-exiting').should.equal(true);
            });
        });

        describe('and the host reopens it', () => {
            beforeEach(async () => {
                await act(async () => root.render(sidebar(true)));
            });

            it('should enter again instead of completing the exit', () => {
                document.querySelector('.cratis-chat-sidebar')!
                    .hasAttribute('data-entering').should.equal(true);
            });
        });

        describe('and the exit animation does not fire', () => {
            beforeEach(async () => {
                await act(async () => vi.advanceTimersByTime(200));
            });

            it('should remain mounted and exiting before the fallback timeout', () => {
                document.querySelector('.cratis-chat-sidebar')!
                    .hasAttribute('data-exiting').should.equal(true);
            });

            describe('and the fallback timeout elapses', () => {
                beforeEach(async () => {
                    await act(async () => vi.advanceTimersByTime(100));
                });

                it('should unmount the panel', () => {
                    (document.querySelector('.cratis-chat-sidebar') === null).should.equal(true);
                });
            });
        });
    });
});
