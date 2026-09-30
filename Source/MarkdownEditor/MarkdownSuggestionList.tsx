// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { classNames } from '../ClassNames/classNames';
import type { CaretPosition } from './CaretPosition';
import type { MarkdownEditorParts } from './MarkdownEditorParts';
import type { MarkdownSuggestion } from './MarkdownSuggestion';

/** Room kept below the caret before the list opens above it instead. */
const roomBelow = 240;

/** Props for {@link MarkdownSuggestionList}. */
export interface MarkdownSuggestionListProps {
    /** The list's element id, which the writing area points at. */
    id: string;

    /** Builds the element id of the suggestion at an index, which the writing area points at when it is highlighted. */
    optionId: (index: number) => string;

    /** The list's accessible name. */
    label: string;

    /** The suggestions to show. */
    suggestions: readonly MarkdownSuggestion[];

    /** The index of the highlighted suggestion. */
    activeIndex: number;

    /** Where the caret is. */
    caret: CaretPosition;

    /** The stacking order to open at - above any dialog the editor sits in. */
    zIndex: string;

    /** Where to portal the list to. */
    container: HTMLElement;

    /** Highlights a suggestion as the pointer moves onto it. */
    onHighlight: (index: number) => void;

    /** Picks a suggestion. */
    onChoose: (suggestion: MarkdownSuggestion) => void;

    /** Renders the content of a suggestion in place of the default. */
    renderSuggestion?: (suggestion: MarkdownSuggestion) => ReactNode;

    /** Pass-through attributes for the list and its entries. */
    parts?: Pick<MarkdownEditorParts, 'suggestions' | 'suggestion'>;
}

const DefaultSuggestion = ({ suggestion }: { suggestion: MarkdownSuggestion }) => (
    <>
        {suggestion.detail && <span className='cratis-markdown-editor__suggestion-detail'>{suggestion.detail}</span>}
        <span className='cratis-markdown-editor__suggestion-label'>{suggestion.label}</span>
        {suggestion.annotation && (
            <span className='cratis-markdown-editor__suggestion-annotation'>{suggestion.annotation}</span>
        )}
    </>
);

/**
 * The list of suggestions that opens at the caret while a completion is typed.
 *
 * Portaled out of the editor so no scrolling or clipping ancestor cuts it off, and marked as a top
 * layer so a modal dialog around the editor neither hides it from assistive technology nor closes when
 * it is clicked. Focus never leaves the writing area: the list is driven through
 * `aria-activedescendant`, and pressing an entry does not take focus.
 */
export const MarkdownSuggestionList = ({
    id,
    optionId,
    label,
    suggestions,
    activeIndex,
    caret,
    zIndex,
    container,
    onHighlight,
    onChoose,
    renderSuggestion,
    parts,
}: MarkdownSuggestionListProps) => {
    const opensAbove = caret.bottom + roomBelow > window.innerHeight && caret.top > window.innerHeight - caret.bottom;
    const style: CSSProperties = {
        ...parts?.suggestions?.style,
        zIndex,
        left: Math.max(0, Math.min(caret.left, window.innerWidth - 16)),
        ...(opensAbove ? { bottom: window.innerHeight - caret.top + 4 } : { top: caret.bottom + 4 }),
    };

    return createPortal(
        <div
            {...parts?.suggestions}
            id={id}
            role='listbox'
            aria-label={label}
            className={classNames('cratis-markdown-editor__suggestions', parts?.suggestions?.className)}
            data-cratis-part='suggestions'
            data-react-aria-top-layer='true'
            style={style}
        >
            {suggestions.map((suggestion, index) => (
                <div
                    key={suggestion.id}
                    {...parts?.suggestion}
                    id={optionId(index)}
                    role='option'
                    aria-selected={index === activeIndex}
                    className={classNames('cratis-markdown-editor__suggestion', parts?.suggestion?.className)}
                    data-cratis-part='suggestion'
                    data-selected={index === activeIndex || undefined}
                    onMouseDown={event => event.preventDefault()}
                    onMouseEnter={() => onHighlight(index)}
                    onClick={() => onChoose(suggestion)}
                >
                    {renderSuggestion ? renderSuggestion(suggestion) : <DefaultSuggestion suggestion={suggestion} />}
                </div>
            ))}
        </div>,
        container,
    );
};
