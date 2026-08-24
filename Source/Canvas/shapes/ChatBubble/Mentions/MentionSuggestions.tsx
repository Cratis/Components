// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PersonAvatarCircle, type BuildAvatarUrlParams } from '../Avatar';
import { ChatAuthorKind } from '../ChatAuthorKind';
import type { MentionCandidate } from './MentionCandidate';

/**
 * Props for the list that opens while an `@` mention is being typed, showing people and agents
 * together with their avatars.
 */
export interface MentionSuggestionsProps {
    /** The candidates to offer, already filtered by what has been typed. */
    candidates: MentionCandidate[];

    /** The index of the highlighted candidate, which Enter picks. */
    highlightedIndex: number;

    /** Invoked with the candidate the user picked. */
    onSelect: (candidate: MentionCandidate) => void;

    /** Invoked when the pointer moves onto a candidate, so hover and keyboard stay in step. */
    onHighlight: (index: number) => void;

    /** Builds the avatar image URL. Omit to always show initials — see {@link PersonAvatarCircleProps}. */
    buildAvatarUrl?: (params: BuildAvatarUrlParams) => string;
}

/**
 * The list that opens while an `@` mention is being typed, showing people and agents together with
 * their avatars.
 */
export const MentionSuggestions = ({
    candidates,
    highlightedIndex,
    onSelect,
    onHighlight,
    buildAvatarUrl,
}: MentionSuggestionsProps) => (
    <div className='mention-suggestions' role='listbox'>
        {candidates.map((candidate, index) => (
            <button
                key={candidate.id}
                type='button'
                role='option'
                aria-selected={index === highlightedIndex}
                className={`mention-suggestions__item${index === highlightedIndex ? ' mention-suggestions__item--highlighted' : ''}`}
                // The input must keep focus, so the pointer press never reaches it as a blur.
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => onHighlight(index)}
                onClick={() => onSelect(candidate)}
            >
                <PersonAvatarCircle
                    userId={candidate.id}
                    name={candidate.name}
                    hasAvatar={candidate.hasAvatar}
                    size={20}
                    ownerType={
                        candidate.kind === ChatAuthorKind.Agent ? 'Agents' : 'Users'
                    }
                    version={candidate.avatarVersion}
                    buildAvatarUrl={buildAvatarUrl}
                />
                <span className='mention-suggestions__name'>{candidate.name}</span>
            </button>
        ))}
    </div>
);
