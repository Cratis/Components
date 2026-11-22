// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

/** The row and rename behavior the name editing state depends on. */
export interface RowNameEditingOptions {
    propertyId: string;
    propertyName: string;
    canRename: boolean;
    describeName: (name: string) => string | undefined;
    rename: (propertyId: string, name: string) => void;
}

/** Holds the rename draft, validation message and keyboard handling of one schema property row. */
export const useRowNameEditing = (options: RowNameEditingOptions) => {
    const { propertyId, propertyName, canRename, describeName, rename } = options;
    const nameInput = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(propertyName);
    const [problem, setProblem] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (isEditing) nameInput.current?.select();
    }, [isEditing]);

    const startEditing = () => {
        if (!canRename) return;
        setDraftName(propertyName);
        setProblem(undefined);
        setIsEditing(true);
    };
    const stopEditing = () => {
        setIsEditing(false);
        setProblem(undefined);
    };
    const commit = (): boolean => {
        const name = draftName.trim();
        if (name === propertyName) {
            stopEditing();
            return true;
        }
        const message = describeName(name);
        if (message) {
            setProblem(message);
            return false;
        }
        stopEditing();
        rename(propertyId, name);
        return true;
    };
    const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commit();
        } else if (event.key === 'Escape') {
            event.stopPropagation();
            stopEditing();
        }
    };

    return { isEditing, draftName, setDraftName, problem, setProblem, nameInput, startEditing, stopEditing, commit, handleEditKeyDown };
};
