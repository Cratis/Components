// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import { expect, vi } from 'vitest';
import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';
import { ChatComposer } from '../ChatComposer';
import { ChatMessageBubble } from '../ChatMessageBubble';
import { ChatAuthorKind } from '../ChatAuthorKind';
import { click, press, render, unmount } from './given/an_overlay_in_the_dom';

const messageId = Guid.create();
const userId = Guid.create();
const message = { id: messageId, authorId: userId, authorName: 'Sample User', authorInitials: 'SU', hasAvatar: false, authorKind: ChatAuthorKind.User, text: 'Hello', timestamp: new Date(), reactions: [] };

for (const kind of ['composer', 'message'] as const) {
    describe(`when picking an emoji from a ${kind} in a custom container`, () => {
        beforeEach(() => { vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined }); });
        afterEach(() => { vi.unstubAllGlobals(); });
        it('should select and dismiss without changing the callback shape', async () => {
            const target = document.createElement('div');
            document.body.append(target);
            const react = vi.fn();
            const mounted = await render(
                <CratisComponentsProvider overlayEnvironment={{ getContainer: () => target }}>
                    {kind === 'composer' ? <ChatComposer onSend={() => undefined} /> : <ChatMessageBubble message={message} currentUserId={userId} onReact={react} showAuthor={false} showTimestamp={false} formattedTimestamp='' />}
                </CratisComponentsProvider>,
            );
            try {
                const toggle = mounted.container.querySelector<HTMLButtonElement>(kind === 'composer' ? '.chat-composer__emoji-toggle' : '.chat-bubble-action')!;
                await click(toggle);
                const emoji = target.querySelector<HTMLButtonElement>('.reaction-picker__item')!;
                expect(emoji).not.toBeNull();
                const value = emoji.textContent;
                await click(emoji);
                expect(target.querySelector('.reaction-picker')).toBeNull();
                if (kind === 'composer') expect(mounted.container.querySelector('textarea')!.value).toBe(value);
                else expect(react).toHaveBeenCalledWith(messageId, value);
                await click(toggle);
                await press(target.querySelector<HTMLButtonElement>('.reaction-picker__item')!, 'Escape');
                expect(target.querySelector('.reaction-picker')).toBeNull();
            } finally { await unmount(mounted); target.remove(); }
        });
    });
}
