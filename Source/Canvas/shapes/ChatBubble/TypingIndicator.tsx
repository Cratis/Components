// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PersonAvatarCircle, type BuildAvatarUrlParams } from './Avatar';
import { ChatAuthorKind } from './ChatAuthorKind';
import type { ChatTypingAuthor } from './ChatTypingAuthor';

export interface TypingIndicatorProps {

    /** Who is currently typing or working. Rendering is skipped when nobody is. */
    authors: ChatTypingAuthor[];

    /** The label shown next to the dots, already composed from the authors' names. */
    label: string;

    /** Builds the avatar image URL. Omit to always show initials — see {@link PersonAvatarCircleProps}. */
    buildAvatarUrl?: (params: BuildAvatarUrlParams) => string;
}

/**
 * The classic jumping dots, shown while somebody is composing a message — a person typing or an
 * agent working on its answer. Both read the same way on purpose: an agent at work is a teammate
 * mid-sentence, not a spinner.
 */
export const TypingIndicator = ({ authors, label, buildAvatarUrl }: TypingIndicatorProps) => {
    if (authors.length === 0) {
        return null;
    }

    return (
        <div className='chat-typing' aria-live='polite'>
            <div className='chat-typing__authors'>
                {authors.map(author => (
                    <PersonAvatarCircle
                        key={author.id}
                        userId={author.id}
                        name={author.name}
                        hasAvatar={author.hasAvatar}
                        size={18}
                        ownerType={author.kind === ChatAuthorKind.Agent ? 'Agents' : 'Users'}
                        buildAvatarUrl={buildAvatarUrl}
                    />
                ))}
            </div>
            <span className='chat-typing__label'>{label}</span>
            <span className='chat-typing__dots' aria-hidden='true'>
                <span className='chat-typing__dot' />
                <span className='chat-typing__dot' />
                <span className='chat-typing__dot' />
            </span>
        </div>
    );
};
