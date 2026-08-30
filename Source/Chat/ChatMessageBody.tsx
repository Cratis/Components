// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { mentionSegments } from './Kit/Mentions';
import type { ChatMention } from './ChatMention';

/**
 * Props for {@link ChatMessageBody}.
 */
export interface ChatMessageBodyProps {
    /** The message text. Mentions appear in it as plain `@Name` text. */
    body: string;

    /** Who the body mentions — these render distinctly. Omit for a body with no mentions. */
    mentions?: ChatMention[];
}

/**
 * The text of one message. The body itself is plain text — including its `@Name` mentions — and
 * this component is what makes the mentions *look* like mentions: each known one renders as its
 * own element, marked with who it addresses, so a person and an agent mention can be styled
 * apart and the host's own CSS can hang further behavior off them.
 */
export const ChatMessageBody = ({ body, mentions }: ChatMessageBodyProps) => (
    <p className='cratis-chat-message__body'>
        {mentionSegments(body, mentions ?? []).map((segment, index) =>
            segment.mention ? (
                <span
                    key={index}
                    className='cratis-chat-message__mention'
                    data-kind={segment.mention.kind}
                >
                    {segment.text}
                </span>
            ) : (
                <React.Fragment key={index}>{segment.text}</React.Fragment>
            ),
        )}
    </p>
);
