// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Drawer as PrimeDrawer } from 'primereact/drawer';
import type { DrawerRootProps, DrawerRootChangeEvent } from '@primereact/types/primitive/drawer';
import type { ChatConversationLabels, ChatConversationProps } from './ChatConversation';
import { ChatConversation } from './ChatConversation';
import { sameChatIdentifier, type ChatIdentifier } from './ChatIdentifier';
import type { ChatMention } from './ChatMention';
import type { ChatMessage } from './ChatMessage';
import type { ChatTopic } from './ChatTopic';
import type { ChatTopicListLabels } from './ChatTopicList';
import { ChatTopicList } from './ChatTopicList';
import { isTopicUnnamed as defaultIsTopicUnnamed } from './isTopicUnnamed';
import { shouldRequestTopicName } from './shouldRequestTopicName';

/** Overrides for every label the {@link ChatSidebar} and its children render. Any field left
 *  unset falls back to a literal English default. */
export interface ChatSidebarLabels {

    /** The sidebar's title while the topic list is showing. Defaults to `'Topics'`. */
    topics?: string;

    /** Placeholder title for a topic that has not been named yet. Defaults to `'New topic'`. */
    unnamedTopic?: string;

    /** Tooltip/accessible label for the back-to-topics button. Defaults to `'Back to topics'`. */
    back?: string;

    /** Accessible label for the close button. Defaults to `'Close chat'`. */
    close?: string;

    /** Labels forwarded to the {@link ChatTopicList}. */
    topicList?: ChatTopicListLabels;

    /** Labels forwarded to the {@link ChatConversation}. */
    conversation?: ChatConversationLabels;
}

/**
 * Props for {@link ChatSidebar}.
 * @typeParam TMessage The host's message type — anything extending {@link ChatMessage}.
 * @typeParam TTopic The host's topic type — anything extending {@link ChatTopic}.
 */
export interface ChatSidebarProps<TMessage extends ChatMessage = ChatMessage, TTopic extends ChatTopic = ChatTopic>
    extends Omit<ChatConversationProps<TMessage>, 'messages' | 'onSendMessage' | 'labels' | 'className'> {

    /** Whether the sidebar is open. */
    open: boolean;

    /** Invoked when the sidebar asks to close — the host owns {@link open}, so closing means the host flips it. */
    onClose: () => void;

    /**
     * The topics, in any order. Hand this the array a live (observable) query delivers and the
     * sidebar re-renders as it changes.
     */
    topics: TTopic[];

    /**
     * The messages — either the whole chat or just the open topic's; the sidebar shows those of
     * the open topic by matching on `topicId` either way. Hand this the array a live
     * (observable) query delivers and the conversation re-renders as it changes.
     */
    messages: TMessage[];

    /**
     * The open topic, for hosts that own the selection themselves: an identifier opens that
     * topic's conversation, `null` shows the topic list, and leaving the prop unset lets the
     * sidebar keep the selection internally.
     */
    selectedTopicId?: ChatIdentifier | null;

    /**
     * Invoked when the open topic changes — a topic was opened (or just started), or the person
     * went back to the list.
     * @param topicId The identifier of the topic now open, or undefined for the list.
     * @param topic The topic itself, when it is known in {@link topics}.
     */
    onTopicSelected?: (topicId: ChatIdentifier | undefined, topic?: TTopic) => void;

    /**
     * Invoked when a new topic is asked for. Creating the topic is the host's business; answer
     * with its identifier (directly or through a promise) and the sidebar opens it, ready for
     * the first message. Omit to leave the new-topic affordance off.
     * @returns The identifier of the topic that was started, when the host created one.
     */
    onStartTopic?: () => ChatIdentifier | undefined | Promise<ChatIdentifier | undefined>;

    /**
     * Invoked when a message is sent, with the topic it belongs to, the trimmed body and who it
     * mentions. Everything else about persisting the message is the host's business.
     * @param topicId The identifier of the topic the message was sent in.
     * @param body The message text, mentions written into it as plain `@Name`.
     * @param mentions Who the body mentions.
     */
    onSendMessage: (topicId: ChatIdentifier, body: string, mentions: ChatMention[]) => void;

    /**
     * Invoked when the very first message is sent in a topic that has no name yet — the host
     * asks its LLM (or whatever it prefers) for a good name and supplies it through the topic
     * data; until then the topic renders its pending placeholder. Not invoked again for later
     * messages, and never for a topic that already has a name.
     * @param topic The topic that needs a name.
     * @param firstMessageBody The message to derive the name from.
     */
    onRequestTopicName?: (topic: TTopic, firstMessageBody: string) => void;

    /**
     * Decides whether a topic counts as unnamed — see {@link ChatTopicListProps.isTopicUnnamed}.
     * @param topic The topic to check.
     * @returns True when the topic has no usable name yet.
     */
    isTopicUnnamed?: (topic: TTopic) => boolean;

    /** Which edge the sidebar opens from. Defaults to `'right'`. */
    position?: 'left' | 'right';

    /** The sidebar's width, any CSS length. Defaults to `'24rem'`. */
    width?: string;

    /**
     * Whether the sidebar is modal — a backdrop behind it, and dismissing by clicking outside.
     * Defaults to false: a chat lives *next to* the work, so it should not block it.
     */
    modal?: boolean;

    /** Overrides for every label rendered. Unset fields fall back to literal English defaults. */
    labels?: ChatSidebarLabels;

    /** Additional class name for the sidebar's popup element. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying Drawer. */
    pt?: DrawerRootProps['pt'];

    /** PrimeReact pass-through options applied to the underlying Drawer. */
    ptOptions?: DrawerRootProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying Drawer. */
    unstyled?: boolean;
}

/**
 * A topic-based chat in a sidebar next to the view, built on PrimeReact's Drawer. It opens on
 * the topic list; picking a topic (or starting a new one) slides into that conversation, with a
 * back affordance to the list. Everything about *data* is the host's: topics and messages come
 * in as arrays (hand it live query data and it stays current), sends and new topics go out as
 * callbacks, and when the first message lands in an unnamed topic the sidebar asks the host for
 * a name through {@link ChatSidebarProps.onRequestTopicName | onRequestTopicName} — rendering a
 * pending placeholder until the name arrives.
 */
export const ChatSidebar = <TMessage extends ChatMessage = ChatMessage, TTopic extends ChatTopic = ChatTopic>({
    open,
    onClose,
    topics,
    messages,
    selectedTopicId,
    onTopicSelected,
    onStartTopic,
    onSendMessage,
    onRequestTopicName,
    isTopicUnnamed,
    position = 'right',
    width = '24rem',
    modal = false,
    labels,
    className,
    pt,
    ptOptions,
    unstyled,
    ...conversation
}: ChatSidebarProps<TMessage, TTopic>) => {
    const [internalSelectedId, setInternalSelectedId] = useState<ChatIdentifier | undefined>(undefined);
    const isControlled = selectedTopicId !== undefined;
    const openTopicId = isControlled ? (selectedTopicId ?? undefined) : internalSelectedId;
    const openTopic = openTopicId !== undefined ? topics.find(topic => sameChatIdentifier(topic.id, openTopicId)) : undefined;
    const unnamed = isTopicUnnamed ?? defaultIsTopicUnnamed;

    const select = (topicId: ChatIdentifier | undefined, topic?: TTopic) => {
        if (!isControlled) {
            setInternalSelectedId(topicId);
        }
        onTopicSelected?.(topicId, topic ?? (topicId !== undefined ? topics.find(candidate => sameChatIdentifier(candidate.id, topicId)) : undefined));
    };

    const startTopic = async () => {
        const topicId = await onStartTopic?.();
        if (topicId !== undefined) {
            select(topicId);
        }
    };

    const openMessages = openTopicId === undefined
        ? []
        : messages.filter(message => sameChatIdentifier(message.topicId, openTopicId));

    const send = (body: string, mentions: ChatMention[]) => {
        if (openTopicId === undefined) return;
        onSendMessage(openTopicId, body, mentions);
        if (openTopic && shouldRequestTopicName(unnamed(openTopic), openMessages.length)) {
            onRequestTopicName?.(openTopic, body);
        }
    };

    const handleOpenChange = (event: DrawerRootChangeEvent) => {
        if (!event.value) {
            onClose();
        }
    };

    const title = openTopicId === undefined
        ? (labels?.topics ?? 'Topics')
        : openTopic && !unnamed(openTopic)
            ? openTopic.name
            : (labels?.unnamedTopic ?? 'New topic');
    const titleIsPending = openTopicId !== undefined && (!openTopic || unnamed(openTopic));

    return (
        <PrimeDrawer.Root
            open={open}
            position={position}
            dismissable={modal}
            onOpenChange={handleOpenChange}
            pt={pt}
            ptOptions={ptOptions}
            unstyled={unstyled}
        >
            <PrimeDrawer.Portal>
                {modal && <PrimeDrawer.Backdrop />}
                <PrimeDrawer.Popup
                    className={`cratis-chat-sidebar${className ? ` ${className}` : ''}`}
                    style={{ width }}
                >
                    <PrimeDrawer.Header className='cratis-chat-sidebar__header'>
                        {openTopicId !== undefined && (
                            <button
                                type='button'
                                className='cratis-chat-sidebar__back'
                                title={labels?.back ?? 'Back to topics'}
                                aria-label={labels?.back ?? 'Back to topics'}
                                onClick={() => select(undefined)}
                            >
                                <i className='pi pi-arrow-left' aria-hidden='true' />
                            </button>
                        )}
                        <PrimeDrawer.Title className={`cratis-chat-sidebar__title${titleIsPending ? ' cratis-chat-sidebar__title--pending' : ''}`}>
                            {title}
                        </PrimeDrawer.Title>
                        <PrimeDrawer.Close
                            className='cratis-chat-sidebar__close'
                            aria-label={labels?.close ?? 'Close chat'}
                        >
                            <i className='pi pi-times' aria-hidden='true' />
                        </PrimeDrawer.Close>
                    </PrimeDrawer.Header>
                    <PrimeDrawer.Content className='cratis-chat-sidebar__content'>
                        {openTopicId === undefined
                            ? (
                                <ChatTopicList<TTopic>
                                    topics={topics}
                                    onOpen={topic => select(topic.id, topic)}
                                    onStart={onStartTopic ? () => { void startTopic(); } : undefined}
                                    authorOf={conversation.authorOf}
                                    renderAvatar={conversation.renderAvatar}
                                    isTopicUnnamed={isTopicUnnamed}
                                    buildAvatarUrl={conversation.buildAvatarUrl}
                                    labels={{ unnamedTopic: labels?.unnamedTopic, ...labels?.topicList }}
                                />
                            )
                            : (
                                <ChatConversation<TMessage>
                                    {...conversation}
                                    messages={openMessages}
                                    onSendMessage={send}
                                    labels={labels?.conversation}
                                />
                            )}
                    </PrimeDrawer.Content>
                </PrimeDrawer.Popup>
            </PrimeDrawer.Portal>
        </PrimeDrawer.Root>
    );
};
