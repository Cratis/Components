// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import { Modal, ModalOverlay } from 'react-aria-components';
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
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

type ChatSidebarPartAttributes<TElement> = HTMLAttributes<TElement> & {
    [attribute: `data-${string}`]: string | number | boolean | undefined;
};

type ChatSidebarButtonAttributes = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'type'
>;

/** Stable Cratis-owned parts for styling a {@link ChatSidebar}. */
export interface ChatSidebarParts {
    /** Viewport overlay layer the sidebar portals into — only paints/blocks when {@link ChatSidebarProps.modal} is true. */
    backdrop?: ChatSidebarPartAttributes<HTMLDivElement>;
    /** The sidebar panel itself. */
    root?: ChatSidebarPartAttributes<HTMLDivElement>;
    /** Header containing the back affordance, title, and close button. */
    header?: ChatSidebarPartAttributes<HTMLElement>;
    /** The topic list title, or the open topic's name. */
    title?: ChatSidebarPartAttributes<HTMLHeadingElement>;
    /** Back-to-topics button, present only while a topic is open. */
    back?: ChatSidebarButtonAttributes;
    /** Close button. */
    close?: ChatSidebarButtonAttributes;
    /** The topic list / conversation content region. */
    content?: ChatSidebarPartAttributes<HTMLDivElement>;
}

const chatSidebarPartsMatchManifest: ExactPartKeys<ChatSidebarParts, PartsOf<'ChatSidebar'>> = true;
void chatSidebarPartsMatchManifest;

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
export interface ChatSidebarProps<
    TMessage extends ChatMessage = ChatMessage,
    TTopic extends ChatTopic = ChatTopic,
> extends Omit<
    ChatConversationProps<TMessage>,
    'messages' | 'onSendMessage' | 'labels' | 'className'
> {
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
    onSendMessage: (
        topicId: ChatIdentifier,
        body: string,
        mentions: ChatMention[],
    ) => void;

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
     * Whether the sidebar is modal — a backdrop behind it, and dismissing by Escape or clicking
     * outside. Defaults to false: a chat lives *next to* the work, so it should not block it —
     * the background stays visible and interactive, and only the close/back affordances dismiss it.
     */
    modal?: boolean;

    /** Overrides for every label rendered. Unset fields fall back to literal English defaults. */
    labels?: ChatSidebarLabels;

    /** Additional class name for the sidebar's panel element. */
    className?: string;

    /** Cratis-owned per-part attributes. */
    pt?: ChatSidebarParts;
}

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

const BackIcon = () => (
    <svg
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.5'
        aria-hidden='true'
    >
        <line x1='19' y1='12' x2='5' y2='12' />
        <polyline points='12 19 5 12 12 5' />
    </svg>
);

/**
 * A topic-based chat in a sidebar next to the view, built on Components' own overlay primitives
 * (React Aria internally, for accessible dismissal and focus handling). It opens on the topic
 * list; picking a topic (or starting a new one) slides into that conversation, with a back
 * affordance to the list. Everything about *data* is the host's: topics and messages come in as
 * arrays (hand it live query data and it stays current), sends and new topics go out as
 * callbacks, and when the first message lands in an unnamed topic the sidebar asks the host for
 * a name through {@link ChatSidebarProps.onRequestTopicName | onRequestTopicName} — rendering a
 * pending placeholder until the name arrives.
 */
export const ChatSidebar = <
    TMessage extends ChatMessage = ChatMessage,
    TTopic extends ChatTopic = ChatTopic,
>({
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
    ...conversation
}: ChatSidebarProps<TMessage, TTopic>) => {
    const [internalSelectedId, setInternalSelectedId] = useState<
        ChatIdentifier | undefined
    >();
    const isControlled = selectedTopicId !== undefined;
    const openTopicId = isControlled
        ? (selectedTopicId ?? undefined)
        : internalSelectedId;
    const openTopic =
        openTopicId === undefined
            ? undefined
            : topics.find((topic) => sameChatIdentifier(topic.id, openTopicId));
    const unnamed = isTopicUnnamed ?? defaultIsTopicUnnamed;

    const select = (topicId: ChatIdentifier | undefined, topic?: TTopic) => {
        if (!isControlled) {
            setInternalSelectedId(topicId);
        }
        onTopicSelected?.(
            topicId,
            topic ??
                (topicId === undefined
                    ? undefined
                    : topics.find((candidate) =>
                          sameChatIdentifier(candidate.id, topicId),
                      )),
        );
    };

    const startTopic = async () => {
        const topicId = await onStartTopic?.();
        if (topicId !== undefined) {
            select(topicId);
        }
    };

    const openMessages =
        openTopicId === undefined
            ? []
            : messages.filter((message) =>
                  sameChatIdentifier(message.topicId, openTopicId),
              );

    const send = (body: string, mentions: ChatMention[]) => {
        if (openTopicId === undefined) return;
        onSendMessage(openTopicId, body, mentions);
        if (
            openTopic &&
            shouldRequestTopicName(unnamed(openTopic), openMessages.length)
        ) {
            onRequestTopicName?.(openTopic, body);
        }
    };

    const title =
        openTopicId === undefined
            ? (labels?.topics ?? 'Topics')
            : openTopic && !unnamed(openTopic)
              ? openTopic.name
              : (labels?.unnamedTopic ?? 'New topic');
    const titleIsPending =
        openTopicId !== undefined && (!openTopic || unnamed(openTopic));

    const panel = (
        <>
            <header
                {...pt?.header}
                className={classNames(
                    'cratis-chat-sidebar__header',
                    pt?.header?.className,
                )}
                data-cratis-part='header'
            >
                {openTopicId !== undefined && (
                    <button
                        {...pt?.back}
                        type='button'
                        className={classNames(
                            'cratis-chat-sidebar__back',
                            pt?.back?.className,
                        )}
                        data-cratis-part='back'
                        title={labels?.back ?? 'Back to topics'}
                        aria-label={labels?.back ?? 'Back to topics'}
                        onClick={() => select(undefined)}
                    >
                        <BackIcon />
                    </button>
                )}
                <h2
                    {...pt?.title}
                    className={classNames(
                        'cratis-chat-sidebar__title',
                        titleIsPending
                            ? 'cratis-chat-sidebar__title--pending'
                            : undefined,
                        pt?.title?.className,
                    )}
                    data-cratis-part='title'
                >
                    {title}
                </h2>
                <button
                    {...pt?.close}
                    type='button'
                    className={classNames(
                        'cratis-chat-sidebar__close',
                        pt?.close?.className,
                    )}
                    data-cratis-part='close'
                    aria-label={labels?.close ?? 'Close chat'}
                    onClick={onClose}
                >
                    <span aria-hidden='true'>×</span>
                </button>
            </header>
            <div
                {...pt?.content}
                className={classNames(
                    'cratis-chat-sidebar__content',
                    pt?.content?.className,
                )}
                data-cratis-part='content'
            >
                {openTopicId === undefined ? (
                    <ChatTopicList<TTopic>
                        topics={topics}
                        onOpen={(topic) => select(topic.id, topic)}
                        onStart={
                            onStartTopic
                                ? () => {
                                      void startTopic();
                                  }
                                : undefined
                        }
                        authorOf={conversation.authorOf}
                        renderAvatar={conversation.renderAvatar}
                        isTopicUnnamed={isTopicUnnamed}
                        buildAvatarUrl={conversation.buildAvatarUrl}
                        labels={{
                            unnamedTopic: labels?.unnamedTopic,
                            ...labels?.topicList,
                        }}
                    />
                ) : (
                    <ChatConversation<TMessage>
                        {...conversation}
                        messages={openMessages}
                        onSendMessage={send}
                        labels={labels?.conversation}
                    />
                )}
            </div>
        </>
    );

    return (
        <ModalOverlay
            {...pt?.backdrop}
            isOpen={open}
            onOpenChange={(openState) => {
                if (!openState) onClose();
            }}
            isDismissable={modal}
            isKeyboardDismissDisabled={!modal}
            className={classNames(
                'cratis-chat-sidebar__backdrop',
                pt?.backdrop?.className,
            )}
            data-cratis-part='backdrop'
            data-modal={modal}
        >
            <Modal
                {...pt?.root}
                className={classNames(
                    'cratis-chat-sidebar',
                    pt?.root?.className,
                    className,
                )}
                style={{ width, ...pt?.root?.style }}
                data-cratis-part='root'
                data-position={position}
            >
                {panel}
            </Modal>
        </ModalOverlay>
    );
};
