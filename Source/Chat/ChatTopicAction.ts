// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { ChatTopic } from './ChatTopic';

/** An action a host offers on topics. The library ships no topic actions of its own.
 * @typeParam TTopic The host's topic type, so {@link onInvoke} receives the full topic back.
 */
export interface ChatTopicAction<TTopic extends ChatTopic = ChatTopic> {
    /** Identifies the action among its siblings — used as the rendering key. */
    id: string;

    /** The label, used in the tooltip and accessible name alongside the topic's name. */
    label: string;

    /** An icon element or a CSS class name for the host's icon font. Omit to show the label. */
    icon?: string | ReactNode;

    /** Decides which topics the action is offered on. Omit to offer it on all topics.
     * @param topic The topic the action would apply to.
     * @returns True when the action should be offered.
     */
    isAvailable?: (topic: TTopic) => boolean;

    /** Invoked when the action is picked on a topic.
     * @param topic The topic it was picked on.
     */
    onInvoke: (topic: TTopic) => void;
}
