// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import { appendChipCandidates } from './chipValues';

/** What {@link useChipsDraft} needs from the field. */
export interface ChipsDraftSource {
    value: string[];
    onChange: (value: string[]) => void;
    separator?: string;
    max?: number;
    allowDuplicate?: boolean;
}

/**
 * Holds the text being typed into a chips field and turns it into chips on commit.
 * @param source The field value and the rules for adding to it.
 * @returns The draft text, its setter, and the commit action.
 */
export const useChipsDraft = ({ value, onChange, separator, max, allowDuplicate }: ChipsDraftSource) => {
    const [draft, setDraft] = useState('');

    const commit = () => {
        const candidates = (separator ? draft.split(separator) : [draft])
            .map((candidate) => candidate.trim())
            .filter(Boolean);
        if (candidates.length === 0) return;
        onChange(appendChipCandidates(value, candidates, max, allowDuplicate ?? false));
        setDraft('');
    };

    return { draft, setDraft, commit };
};
