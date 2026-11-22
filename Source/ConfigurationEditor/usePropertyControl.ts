// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useId, useState } from 'react';
import type { PropertyControlProps } from './PropertyControl';

/** Keeps a local draft while the host remains the source of committed values. */
export const usePropertyControl = (props: PropertyControlProps) => {
    const { descriptor, value, readOnly, message, onChange } = props;
    const identity = useId();
    const controlId = `${identity}-control`;
    const messageId = `${identity}-message`;
    const [draft, setDraft] = useState<string | null>(null);
    const [entryMessage, setEntryMessage] = useState<string | undefined>(undefined);
    const locked = readOnly || descriptor.editable === false;
    const shownMessage = entryMessage ?? message;
    const note = locked ? descriptor.unavailableReason : descriptor.description;
    const noteId = `${identity}-note`;
    const describedBy = [shownMessage ? messageId : undefined, note ? noteId : undefined].filter(Boolean).join(' ') || undefined;

    useEffect(() => {
        setDraft(null);
    }, [value]);

    const commit = (next: unknown) => {
        setEntryMessage(onChange(descriptor.name, next));
    };
    const leave = () => {
        setDraft(null);
        setEntryMessage(undefined);
    };

    return { ...props, draft, setDraft, setEntryMessage, locked, shownMessage, note, messageId, noteId, describedBy, controlId, commit, leave };
};

/** Internal rendering state; not part of the published component API. */
export type PropertyControlState = ReturnType<typeof usePropertyControl>;
