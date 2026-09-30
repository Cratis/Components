// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState } from 'react';
import { replacePlaceholder } from './replacePlaceholder';
import { uploadPlaceholderFor } from './uploadPlaceholderFor';

/**
 * What {@link useMarkdownUploads} needs from the editor it uploads for.
 */
export interface MarkdownUploadsOptions {
    /** Uploads one file and returns the markdown that stands for it. Omit to turn uploads off. */
    uploadFile?: (file: File) => Promise<string>;

    /** Told about a file whose upload failed; its placeholder has already been taken out again. */
    onUploadFailed?: (file: File, error: unknown) => void;

    /** Reads the markdown as it is right now, not as it was when an upload started. */
    currentValue: () => string;

    /** Puts text in at the caret. */
    insertAtCaret: (text: string) => void;

    /** Replaces the whole markdown. */
    replaceValue: (value: string) => void;
}

/**
 * The state of the uploads started from an editor, as {@link useMarkdownUploads} reports it.
 */
export interface MarkdownUploadsState {
    /** Whether files can be uploaded at all. */
    isEnabled: boolean;

    /** The names of the files uploading right now, in the order they were added. */
    uploading: readonly string[];

    /**
     * Uploads files, each behind a placeholder put in at the caret straight away.
     * @param files The files to upload.
     */
    upload: (files: readonly File[]) => void;
}

/**
 * Uploads pasted and dropped files. Every file gets its placeholder at the caret first, so several
 * added at once keep their order wherever the caret wanders, and each placeholder is resolved by value
 * when its upload answers - replaced by the returned markdown, or taken out when the upload fails.
 * @param options The {@link MarkdownUploadsOptions}.
 * @returns The {@link MarkdownUploadsState}.
 */
export const useMarkdownUploads = (options: MarkdownUploadsOptions): MarkdownUploadsState => {
    const [uploading, setUploading] = useState<readonly string[]>([]);
    const optionsRef = useRef(options);
    const mounted = useRef(true);

    useEffect(() => {
        optionsRef.current = options;
    });

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const uploadOne = async (file: File, uploadFile: (file: File) => Promise<string>) => {
        const placeholder = uploadPlaceholderFor(file.name);
        optionsRef.current.insertAtCaret(`${placeholder}\n`);
        setUploading(current => [...current, file.name]);

        try {
            const markup = await uploadFile(file);
            if (mounted.current) {
                optionsRef.current.replaceValue(replacePlaceholder(optionsRef.current.currentValue(), placeholder, markup));
            }
        } catch (error) {
            if (mounted.current) {
                const current = optionsRef.current.currentValue();
                const inserted = current.includes(`${placeholder}\n`) ? `${placeholder}\n` : placeholder;
                optionsRef.current.replaceValue(replacePlaceholder(current, inserted, ''));
            }
            optionsRef.current.onUploadFailed?.(file, error);
        } finally {
            if (mounted.current) {
                setUploading(current => {
                    const index = current.indexOf(file.name);
                    return index === -1 ? current : [...current.slice(0, index), ...current.slice(index + 1)];
                });
            }
        }
    };

    const upload = (files: readonly File[]) => {
        const uploadFile = optionsRef.current.uploadFile;
        if (!uploadFile) return;
        void Promise.all(files.map(file => uploadOne(file, uploadFile)));
    };

    return { isEnabled: options.uploadFile !== undefined, uploading, upload };
};
