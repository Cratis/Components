// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, type RefObject, type Dispatch, type SetStateAction } from 'react';

interface FolderDismissalOptions {
    isExpanded: boolean;
    isDrawer: boolean;
    containerRef: RefObject<HTMLDivElement | null>;
    setIsExpanded: Dispatch<SetStateAction<boolean>>;
    setIsDragging: Dispatch<SetStateAction<boolean>>;
    close: (restoreFocus: boolean) => void;
}

/** Owns the document listeners only while the folder is open. */
export const useToolbarFolderDismissal = (options: FolderDismissalOptions) => {
    const { isExpanded, isDrawer, containerRef, setIsExpanded, setIsDragging, close } = options;
    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        const handleClickOutside = (event: Event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsExpanded(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            close(true);
        };

        document.addEventListener('mousedown', handleClickOutside);
        if (isDrawer) document.addEventListener('pointerdown', handleClickOutside);
        document.addEventListener('keydown', handleEscape, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('pointerdown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape, true);
        };
    }, [isExpanded, isDrawer, close, containerRef, setIsExpanded]);

    useEffect(() => {
        if (!isExpanded) setIsDragging(false);
    }, [isExpanded, setIsDragging]);
};
