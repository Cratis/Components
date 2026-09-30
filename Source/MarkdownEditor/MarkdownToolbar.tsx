// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Fragment, useRef, useState, type KeyboardEvent } from 'react';
import { classNames } from '../ClassNames/classNames';
import type { MarkdownFormat } from './MarkdownFormat';
import type { MarkdownEditorLabels } from './MarkdownEditorLabels';
import type { MarkdownEditorParts } from './MarkdownEditorParts';
import { formatIcons } from './formatIcons';
import { formatShortcuts } from './formatShortcuts';

/** Props for {@link MarkdownToolbar}. */
export interface MarkdownToolbarProps {
    /** The formats to offer, in groups separated from each other. */
    formats: readonly (readonly MarkdownFormat[])[];

    /** The resolved labels. */
    labels: Required<MarkdownEditorLabels>;

    /** Whether the formats can be applied. */
    disabled: boolean;

    /** Applies a format to the writing area's selection. */
    onFormat: (format: MarkdownFormat) => void;

    /** Pass-through attributes for the toolbar and its buttons. */
    parts?: Pick<MarkdownEditorParts, 'toolbar' | 'format'>;
}

const shortcutFor = (format: MarkdownFormat) => {
    for (const [letter, shortcut] of formatShortcuts) {
        if (shortcut === format) return `Control+${letter.toUpperCase()} Meta+${letter.toUpperCase()}`;
    }
    return undefined;
};

const navigationKeys = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End']);

/**
 * The formatting toolbar above the writing area. One Tab stop: the arrow keys, Home and End move
 * between the buttons, as the ARIA toolbar pattern describes. A button press never takes focus from
 * the writing area, so the selection it formats stays where it was.
 */
export const MarkdownToolbar = ({ formats, labels, disabled, onFormat, parts }: MarkdownToolbarProps) => {
    const flat = formats.flat();
    const [focusIndex, setFocusIndex] = useState(0);
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);
    const current = Math.min(focusIndex, Math.max(flat.length - 1, 0));

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        parts?.toolbar?.onKeyDown?.(event);
        if (!navigationKeys.has(event.key) || flat.length === 0) return;
        event.preventDefault();
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? flat.length - 1
                  : (current + (event.key === 'ArrowRight' ? 1 : -1) + flat.length) % flat.length;
        setFocusIndex(next);
        buttons.current[next]?.focus();
    };

    const offsets = formats.map((_, groupIndex) =>
        formats.slice(0, groupIndex).reduce((total, group) => total + group.length, 0),
    );

    return (
        <div
            {...parts?.toolbar}
            role='toolbar'
            aria-label={labels.toolbar}
            className={classNames('cratis-markdown-editor__toolbar', parts?.toolbar?.className)}
            data-cratis-part='toolbar'
            onKeyDown={onKeyDown}
        >
            {formats.map((group, groupIndex) => (
                <Fragment key={group.join('-')}>
                    {groupIndex > 0 && <span className='cratis-markdown-editor__separator' aria-hidden='true' />}
                    {group.map((format, formatIndex) => {
                        const index = offsets[groupIndex] + formatIndex;
                        return (
                            <button
                                key={format}
                                {...parts?.format}
                                ref={element => {
                                    buttons.current[index] = element;
                                }}
                                type='button'
                                className={classNames('cratis-markdown-editor__format', parts?.format?.className)}
                                data-cratis-part='format'
                                data-disabled={disabled || undefined}
                                disabled={disabled}
                                tabIndex={index === current ? 0 : -1}
                                aria-label={labels[format]}
                                aria-keyshortcuts={shortcutFor(format)}
                                title={labels[format]}
                                onMouseDown={event => event.preventDefault()}
                                onFocus={() => setFocusIndex(index)}
                                onClick={() => onFormat(format)}
                            >
                                <span className='cratis-markdown-editor__format-icon' aria-hidden='true'>
                                    {formatIcons[format]}
                                </span>
                            </button>
                        );
                    })}
                </Fragment>
            ))}
        </div>
    );
};
