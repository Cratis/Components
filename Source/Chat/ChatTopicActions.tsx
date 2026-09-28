// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { FocusEventHandler } from 'react';
import type { ChatTopic } from './ChatTopic';
import type { ChatTopicAction } from './ChatTopicAction';

/**
 * Props for {@link ChatTopicActions}.
 * @typeParam TTopic The topic type the list renders.
 */
export interface ChatTopicActionsProps<TTopic extends ChatTopic> {
    /** The topic the actions act on. */
    topic: TTopic;
    /** The topic's visible name, used to give each action an accessible name for its topic. */
    topicName: string | undefined;
    /** The actions available for this topic. */
    actions: ChatTopicAction<TTopic>[];
    /** Called when an action button gains focus. */
    onActionFocus: FocusEventHandler<HTMLButtonElement>;
    /** Called when an action button loses focus. */
    onActionBlur: FocusEventHandler<HTMLButtonElement>;
}

/**
 * The action buttons shown beside a topic's opening button. Reuses the message action overlay,
 * which keyboard focus reveals.
 */
export const ChatTopicActions = <TTopic extends ChatTopic>({
    topic,
    topicName,
    actions,
    onActionFocus,
    onActionBlur,
}: ChatTopicActionsProps<TTopic>) => (
    <div className='cratis-chat-message__actions'>
        {actions.map((action) => (
            <button
                key={action.id}
                type='button'
                className='cratis-chat-message__action'
                style={action.icon == null ? { width: 'auto', padding: '0 0.375rem' } : undefined}
                title={action.label}
                aria-label={`${action.label} ${topicName}`}
                onFocus={onActionFocus}
                onBlur={onActionBlur}
                onClick={() => action.onInvoke(topic)}
            >
                {typeof action.icon === 'string' ? (
                    <i className={action.icon} aria-hidden='true' />
                ) : (action.icon ?? action.label)}
            </button>
        ))}
    </div>
);
