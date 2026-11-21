// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Guid } from '@cratis/fundamentals';
import { afterEach, beforeAll, describe, it, vi } from 'vitest';
import { ChatConversation } from '../Chat/ChatConversation';
import { ChatMessageBody } from '../Chat/ChatMessageBody';
import { ChatTopicList } from '../Chat/ChatTopicList';
import { PersonAvatarCircle } from '../Chat/Kit/Avatar/PersonAvatarCircle';
import { ChatAuthorKind } from '../Chat/Kit/ChatAuthorKind';
import { ChatComposer } from '../Chat/Kit/ChatComposer';
import type { ChatMessage } from '../Chat/Kit/ChatMessage';
import { ChatMessageBubble } from '../Chat/Kit/ChatMessageBubble';
import { EmojiPicker } from '../Chat/Kit/Emoji/EmojiPicker';
import { FailedReply } from '../Chat/Kit/FailedReply';
import { MentionSuggestions } from '../Chat/Kit/Mentions/MentionSuggestions';
import { MessageReactions } from '../Chat/Kit/MessageReactions';
import { ReactionPicker } from '../Chat/Kit/ReactionPicker';
import { TypingIndicator } from '../Chat/Kit/TypingIndicator';
import { nearestComponent } from '../ComponentPicker/componentElements';
import { PropertyType } from '../SchemaEditor/Tree/PropertyType';
import { PropertyTypeGlyph } from '../SchemaEditor/Tree/PropertyTypeGlyph';

const noop = () => undefined;
const message: ChatMessage = {
    id: Guid.parse('00000000-0000-0000-0000-000000000001'),
    authorId: Guid.parse('00000000-0000-0000-0000-000000000002'),
    authorName: 'Sample User',
    authorInitials: 'SU',
    hasAvatar: false,
    authorKind: ChatAuthorKind.User,
    text: 'Example message',
    timestamp: new Date('2026-01-01T12:00:00Z'),
};
const candidate = { id: 'example-user', name: 'Sample User', hasAvatar: false, kind: ChatAuthorKind.User };
const reactions = [{ emoji: '👍', users: [{ id: message.authorId, name: 'Sample User', reactionId: message.id }] }];
const avatar = <PersonAvatarCircle userId='example-user' name='Sample User' hasAvatar={false} size={22} />;
const bubble = <ChatMessageBubble message={message} showAuthor showTimestamp formattedTimestamp='Now' />;

const examples: Record<string, { element: React.ReactElement; root: string; className: string }> = {
    ChatComposer: { element: <ChatComposer onSend={noop} />, root: 'div', className: 'chat-composer' },
    ChatConversation: { element: <ChatConversation messages={[]} onSendMessage={noop} />, root: 'div', className: 'cratis-chat-conversation' },
    ChatMessageBody: { element: <ChatMessageBody body='Example message' />, root: 'p', className: 'cratis-chat-message__body' },
    ChatMessageBubble: { element: bubble, root: 'div', className: 'chat-bubble' },
    ChatTopicList: { element: <ChatTopicList topics={[]} onOpen={noop} />, root: 'div', className: 'cratis-chat-topics' },
    EmojiPicker: { element: <EmojiPicker onPick={noop} />, root: 'div', className: 'emoji-picker' },
    FailedReply: { element: <FailedReply message={{ ...message, failureDetail: 'Example failure' }} />, root: 'div', className: 'chat-failed-reply' },
    MentionSuggestions: { element: <MentionSuggestions candidates={[candidate]} highlightedIndex={0} id='example-suggestions' onSelect={noop} onHighlight={noop} />, root: 'div', className: 'mention-suggestions' },
    MessageReactions: { element: <MessageReactions reactions={reactions} />, root: 'div', className: 'message-reactions' },
    PersonAvatarCircle: { element: avatar, root: 'span', className: 'person-avatar-circle' },
    PropertyTypeGlyph: { element: <PropertyTypeGlyph type={PropertyType.Date} />, root: 'span', className: 'cratis-schema-editor__badge-glyph' },
    ReactionPicker: { element: <ReactionPicker onPick={noop} onDismiss={noop} />, root: 'div', className: 'reaction-picker' },
    TypingIndicator: { element: <TypingIndicator authors={[candidate]} label='Sample User is typing' />, root: 'div', className: 'chat-typing' },
};

let container: HTMLDivElement;
let root: Root;

const render = async (element: React.ReactElement) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(element));
};

const markedRoot = (name: string) => {
    const marked = container.querySelectorAll<HTMLElement>(`[data-cratis-component="${name}"]`);
    marked.length.should.equal(1);
    return marked[0];
};

beforeAll(() => {
    // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Element.prototype.scrollIntoView = vi.fn();
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

describe('when rendering marked chat and schema components', () => {
    for (const [name, example] of Object.entries(examples)) {
        it(`should mark the existing ${name} root without wrapping it`, async () => {
            await render(example.element);
            const marked = markedRoot(name);
            marked.tagName.toLowerCase().should.equal(example.root);
            marked.classList.contains(example.className).should.equal(true);
            (marked.parentElement === container).should.equal(true);
        });
    }

    it('should select the bubble from message text and the nested avatar from its initials', async () => {
        await render(bubble);
        (nearestComponent(container.querySelector('.chat-bubble-text')) === markedRoot('ChatMessageBubble')).should.equal(true);
        (nearestComponent(container.querySelector('.person-avatar-circle-initials')) === markedRoot('PersonAvatarCircle')).should.equal(true);
    });

    it('should keep the marker on a continuation bubble without author or timestamp', async () => {
        await render(<ChatMessageBubble message={message} showAuthor={false} showTimestamp={false} formattedTimestamp='Now' />);
        markedRoot('ChatMessageBubble').classList.contains('chat-bubble--continuation').should.equal(true);
        container.querySelectorAll('[data-cratis-component="PersonAvatarCircle"]').length.should.equal(0);
    });

    it('should mark the populated conversation while retaining its send behavior', async () => {
        const onSend = vi.fn();
        await render(<ChatConversation messages={[{ id: 'example-message', topicId: 'example-topic', authorId: 'example-user', body: 'Example message', timestamp: message.timestamp }]} onSendMessage={onSend} />);
        markedRoot('ChatConversation');
        markedRoot('ChatMessageBody').textContent!.should.equal('Example message');
        const input = container.querySelector('textarea')!;
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
        await act(async () => {
            setter.call(input, 'Example reply');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
        onSend.mock.calls.length.should.equal(1);
        onSend.mock.calls[0][0].should.equal('Example reply');
    });

    it('should keep the topic list marker when topics are populated', async () => {
        await render(<ChatTopicList topics={[{ id: 'example-topic', name: 'Example Topic' }]} onOpen={noop} />);
        markedRoot('ChatTopicList').querySelectorAll('li').length.should.equal(1);
    });

    it('should select the decorative property glyph from its SVG without changing accessibility', async () => {
        await render(examples.PropertyTypeGlyph.element);
        const glyph = markedRoot('PropertyTypeGlyph');
        (nearestComponent(glyph.querySelector('rect')) === glyph).should.equal(true);
        glyph.getAttribute('aria-hidden')!.should.equal('true');
        glyph.getAttribute('data-property-type')!.should.equal('date');
    });

    it('should retain the avatar marker for images and after falling back from an image error', async () => {
        await render(<PersonAvatarCircle userId='example-user' name='Sample User' hasAvatar size={22} buildAvatarUrl={() => 'https://example.invalid/avatar.png'} />);
        const avatarRoot = markedRoot('PersonAvatarCircle');
        const image = avatarRoot.querySelector('img')!;
        image.alt.should.equal('Sample User');
        await act(async () => image.dispatchEvent(new Event('error')));
        (markedRoot('PersonAvatarCircle') === avatarRoot).should.equal(true);
        avatarRoot.textContent!.should.equal('SU');
        avatarRoot.getAttribute('aria-label')!.should.equal('Sample User');
    });

    for (const [name, element] of Object.entries({
        MessageReactions: <MessageReactions reactions={[]} />,
        TypingIndicator: <TypingIndicator authors={[]} label='Nobody is typing' />,
    })) {
        it(`should still render nothing for empty ${name}`, async () => {
            await render(element);
            container.childNodes.length.should.equal(0);
        });
    }

    it('should keep the empty mention list root without inventing options', async () => {
        await render(<MentionSuggestions candidates={[]} highlightedIndex={0} id='empty-suggestions' onSelect={noop} onHighlight={noop} />);
        markedRoot('MentionSuggestions').querySelectorAll('[role="option"]').length.should.equal(0);
    });

    it('should preserve mention option roles, labels, identity, and selection', async () => {
        const onSelect = vi.fn();
        await render(<MentionSuggestions candidates={[candidate]} highlightedIndex={0} id='example-suggestions' onSelect={onSelect} onHighlight={noop} />);
        const suggestions = markedRoot('MentionSuggestions');
        suggestions.id.should.equal('example-suggestions');
        suggestions.getAttribute('role')!.should.equal('listbox');
        suggestions.getAttribute('aria-label')!.should.equal('Mention suggestions');
        const option = suggestions.querySelector<HTMLElement>('[role="option"]')!;
        option.getAttribute('aria-selected')!.should.equal('true');
        await act(async () => option.click());
        onSelect.mock.calls.length.should.equal(1);
        (onSelect.mock.calls[0][0] === candidate).should.equal(true);
    });
});
