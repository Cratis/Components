// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { PersonAvatarCircle, type BuildAvatarUrlParams } from './Kit/Avatar';
import { ChatAuthorKind } from './Kit/ChatAuthorKind';
import type { ChatAuthor } from './ChatAuthor';
import { chatIdentifierString, type ChatIdentifier } from './ChatIdentifier';
import type { ChatTopic } from './ChatTopic';
import { isTopicUnnamed as defaultIsTopicUnnamed } from './isTopicUnnamed';
import { relativeTimestamp, type RelativeTimestampLabels } from './relativeTimestamp';
import { topicsByActivity } from './topicsByActivity';

const PlusIcon = () => (
    <svg
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.5'
        aria-hidden='true'
    >
        <line x1='12' y1='5' x2='12' y2='19' />
        <line x1='5' y1='12' x2='19' y2='12' />
    </svg>
);

/** Overrides for every label the {@link ChatTopicList} renders. Any field left unset falls back
 *  to a literal English default. */
export interface ChatTopicListLabels {
    /** The new-topic button. Defaults to `'New topic'`. */
    newTopic?: string;

    /** Placeholder name for a topic that has not been named yet. Defaults to `'New topic'`. */
    unnamedTopic?: string;

    /** The started-by line under a topic's name. `{name}` is substituted. Defaults to `'Started by {name}'`. */
    startedBy?: string;

    /** Shown when there are no topics yet. Defaults to `'No topics yet. Start the first one!'`. */
    empty?: string;

    /** Overrides for the relative last-activity timestamps. */
    timestamps?: RelativeTimestampLabels;
}

/**
 * Props for {@link ChatTopicList}.
 * @typeParam TTopic The host's topic type — anything extending {@link ChatTopic}.
 */
export interface ChatTopicListProps<TTopic extends ChatTopic = ChatTopic> {
    /**
     * The topics, in any order — the list orders them by most recent activity itself. Hand this
     * the array a live (observable) query delivers and the list re-renders as it changes.
     */
    topics: TTopic[];

    /**
     * Invoked when a topic is picked from the list.
     * @param topic The topic that was picked.
     */
    onOpen: (topic: TTopic) => void;

    /**
     * Invoked when a new topic is asked for. Creating the topic is the host's business — the
     * component only raises the intent. Omit to leave the new-topic affordance off.
     */
    onStart?: () => void;

    /**
     * Resolves an author id into what it takes to render whoever started a topic. Omit to fall
     * back to rendering the id itself as the name.
     * @param authorId The identifier of the author to resolve.
     * @returns The author.
     */
    authorOf?: (authorId: ChatIdentifier) => ChatAuthor;

    /**
     * Renders the avatar for whoever started a topic, replacing the built-in initials circle.
     * @param authorId The identifier of the author.
     * @param author The resolved author, as {@link authorOf} answered.
     * @returns What to render.
     */
    renderAvatar?: (authorId: ChatIdentifier, author: ChatAuthor) => ReactNode;

    /**
     * Decides whether a topic counts as unnamed and renders the pending placeholder. Defaults to
     * "no name, or only whitespace" — override when the host's backend stores a literal
     * placeholder for unnamed topics instead.
     * @param topic The topic to check.
     * @returns True when the topic has no usable name yet.
     */
    isTopicUnnamed?: (topic: TTopic) => boolean;

    /** Builds the avatar image URL for topic starters. Omit to always show initials. */
    buildAvatarUrl?: (params: BuildAvatarUrlParams) => string;

    /** Overrides for every label rendered. Unset fields fall back to literal English defaults. */
    labels?: ChatTopicListLabels;

    /** Additional class name for the list's root element. */
    className?: string;
}

/**
 * The topics of a chat, most recently active first — pick one to open its conversation, or start
 * a new one. A topic that has not been named yet renders a placeholder in a pending style: with
 * host-side auto-naming, the name arrives through the data once the host has produced it, and
 * the placeholder simply stops being needed.
 */
export const ChatTopicList = <TTopic extends ChatTopic = ChatTopic>({
    topics,
    onOpen,
    onStart,
    authorOf,
    renderAvatar,
    isTopicUnnamed,
    buildAvatarUrl,
    labels,
    className,
}: ChatTopicListProps<TTopic>) => {
    const unnamed = isTopicUnnamed ?? defaultIsTopicUnnamed;

    const authorFor = (authorId: ChatIdentifier): ChatAuthor =>
        authorOf?.(authorId) ?? {
            name: chatIdentifierString(authorId),
            kind: ChatAuthorKind.User,
        };

    return (
        <div className={`cratis-chat-topics${className ? ` ${className}` : ''}`}>
            {onStart && (
                <button
                    type='button'
                    className='cratis-chat-topics__start'
                    onClick={onStart}
                >
                    <PlusIcon />
                    <span>{labels?.newTopic ?? 'New topic'}</span>
                </button>
            )}
            {topics.length === 0 && (
                <p className='cratis-chat-topics__empty'>
                    {labels?.empty ?? 'No topics yet. Start the first one!'}
                </p>
            )}
            <ul className='cratis-chat-topics__list'>
                {topicsByActivity(topics).map((topic) => {
                    const starter =
                        topic.startedBy === undefined
                            ? undefined
                            : authorFor(topic.startedBy);
                    const isPending = unnamed(topic);
                    const activity = topic.lastActivity ?? topic.started;

                    return (
                        <li key={chatIdentifierString(topic.id)}>
                            <button
                                type='button'
                                className='cratis-chat-topics__topic'
                                onClick={() => onOpen(topic)}
                            >
                                {topic.startedBy !== undefined &&
                                    starter &&
                                    (renderAvatar ? (
                                        renderAvatar(topic.startedBy, starter)
                                    ) : (
                                        <PersonAvatarCircle
                                            userId={chatIdentifierString(topic.startedBy)}
                                            name={starter.name}
                                            hasAvatar={starter.hasAvatar ?? false}
                                            size={28}
                                            ownerType={
                                                starter.kind === ChatAuthorKind.Agent
                                                    ? 'Agents'
                                                    : 'Users'
                                            }
                                            version={starter.avatarVersion}
                                            buildAvatarUrl={buildAvatarUrl}
                                        />
                                    ))}
                                <span className='cratis-chat-topics__details'>
                                    <span
                                        className={`cratis-chat-topics__name${isPending ? ' cratis-chat-topics__name--pending' : ''}`}
                                    >
                                        {isPending
                                            ? (labels?.unnamedTopic ?? 'New topic')
                                            : topic.name}
                                    </span>
                                    {starter && (
                                        <span className='cratis-chat-topics__started-by'>
                                            {(
                                                labels?.startedBy ?? 'Started by {name}'
                                            ).replace('{name}', starter.name)}
                                        </span>
                                    )}
                                </span>
                                {activity !== undefined && (
                                    <span className='cratis-chat-topics__activity'>
                                        {relativeTimestamp(
                                            activity,
                                            new Date(),
                                            labels?.timestamps,
                                        )}
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
