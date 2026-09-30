// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { FaEye, FaPen } from 'react-icons/fa6';
import { classNames } from '../ClassNames/classNames';
import { MarkdownEditorMode } from './MarkdownEditorMode';
import type { MarkdownEditorPartAttributes } from './MarkdownEditorParts';
import { nextMarkdownEditorMode } from './nextMarkdownEditorMode';

/** Props for {@link MarkdownModeToggle}. */
export interface MarkdownModeToggleProps {
    /** The mode being shown. */
    mode: MarkdownEditorMode;

    /** Called with the mode to show next. */
    onModeChange: (mode: MarkdownEditorMode) => void;

    /** What the button says while the markdown is showing. */
    showPreviewLabel: string;

    /** What the button says while the preview is showing. */
    showMarkdownLabel: string;

    /** Pass-through attributes for the button. */
    parts?: MarkdownEditorPartAttributes<HTMLButtonElement>;
}

/**
 * The round button in the editor's top-right corner that swaps between the markdown and its preview.
 * A toggle rather than two buttons: `aria-pressed` says whether the preview is showing and the label
 * names what pressing it does, so assistive technology announces both the state and the action.
 */
export const MarkdownModeToggle = ({
    mode,
    onModeChange,
    showPreviewLabel,
    showMarkdownLabel,
    parts,
}: MarkdownModeToggleProps) => {
    const previewing = mode === MarkdownEditorMode.Preview;
    const label = previewing ? showMarkdownLabel : showPreviewLabel;

    return (
        <button
            {...parts}
            type='button'
            className={classNames('cratis-markdown-editor__toggle', parts?.className)}
            data-cratis-part='toggle'
            data-pressed={previewing || undefined}
            aria-pressed={previewing}
            aria-label={label}
            title={label}
            onClick={() => onModeChange(nextMarkdownEditorMode(mode))}
        >
            <span className='cratis-markdown-editor__toggle-icon' aria-hidden='true'>
                {previewing ? <FaPen /> : <FaEye />}
            </span>
        </button>
    );
};
