// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react';
import type { RegionProps } from './Region';

export const useRegionEditing = ({ region, onNameChange }: Pick<RegionProps, 'region' | 'onNameChange'>) => {
    const [isEditing, setIsEditing] = useState(false);
    const titleBarRef = useRef<HTMLDivElement>(null);
    const clickedTitleBarRef = useRef(false);

    const handleDoubleClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
        if (!clickedTitleBarRef.current) return;
        event.stopPropagation();
        setIsEditing(true);
    }, []);

    const commitRename = useCallback((newName: string) => {
        setIsEditing(false);
        const trimmed = newName.trim();
        if (trimmed && trimmed !== region.name) onNameChange(region.id, trimmed);
    }, [region.id, region.name, onNameChange]);

    const handleInputBlur = useCallback((event: FocusEvent<HTMLInputElement>) =>
        commitRename(event.currentTarget.value), [commitRename]);

    const handleInputKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') commitRename(event.currentTarget.value);
        else if (event.key === 'Escape') setIsEditing(false);
    }, [commitRename]);

    return { isEditing, titleBarRef, clickedTitleBarRef, handleDoubleClick, handleInputBlur, handleInputKeyDown };
};
