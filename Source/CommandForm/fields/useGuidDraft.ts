// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import { Guid } from '@cratis/fundamentals';

/** The text a Guid field shows, tied to the command value and reset key it was derived from. */
export interface GuidDraft {
    value: unknown;
    resetKey: unknown;
    text: string;
}

const textForValue = (value: unknown) => (value instanceof Guid ? value.toString() : '');

/** Keeps the editable text for a Guid field, adopting an external value or reset during render. */
export const useGuidDraft = (currentValue: unknown, resetKey: unknown) => {
    const [draft, setDraft] = useState<GuidDraft>(() => ({ value: currentValue, resetKey, text: textForValue(currentValue) }));
    const synchronized = Object.is(draft.value, currentValue) && Object.is(draft.resetKey, resetKey);
    // Adopt an external value or reset during render; a delayed effect could overwrite ongoing typing.
    if (!synchronized) {
        setDraft({ value: currentValue, resetKey, text: textForValue(currentValue) });
    }
    const text = synchronized ? draft.text : textForValue(currentValue);
    return { text, setDraft };
};
