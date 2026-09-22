// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    useId,
    useState,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type Key,
    type ReactNode,
} from 'react';
import {
    Tag as AriaTag,
    TagGroup as AriaTagGroup,
    TagList as AriaTagList,
} from 'react-aria-components/TagGroup';
import { Button as AriaButton } from 'react-aria-components/Button';
import { useCratisIcon } from './useCratisIcon';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

/** Attributes a consumer may hand to one {@link TagGroup} part: class, style, title and data attributes. */
export type TagGroupPartAttributes = Pick<
    HTMLAttributes<HTMLElement>,
    'className' | 'style' | 'title'
> & {
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
};

/** Stable Cratis-owned parts for styling a {@link TagGroup}. */
export interface TagGroupParts {
    /** The element wrapping the tags and the entry. */
    root?: TagGroupPartAttributes;
    /** The tag list. */
    list?: TagGroupPartAttributes;
    /** One tag. */
    tag?: TagGroupPartAttributes;
    /** A tag's remove button. */
    remove?: TagGroupPartAttributes;
    /** The text entry that adds a value. */
    input?: InputHTMLAttributes<HTMLInputElement>;
}

const tagGroupPartsMatchManifest: ExactPartKeys<TagGroupParts, PartsOf<'TagGroup'>> = true;
void tagGroupPartsMatchManifest;

/** Props for {@link TagGroup}. */
export interface TagGroupProps {
    /** Current values, in display order. */
    value: string[];
    /** Called with the next list whenever a value is added or removed. */
    onChange: (value: string[]) => void;
    /**
     * Whether a text entry is offered for adding values. A group without one is a read-only display
     * of removable tags.
     */
    editable?: boolean;
    /** Placeholder for the text entry. */
    placeholder?: string;
    /**
     * Characters that commit the typed value in addition to Enter. Defaults to a comma. A pasted
     * string is split on the same separators, so pasting a comma-separated list adds each value.
     */
    separators?: string[];
    /** Whether a duplicate of an existing value is accepted. Defaults to `false`. */
    allowDuplicates?: boolean;
    /** Whether the whole control is disabled. */
    disabled?: boolean;
    /** Accessible name for the group. */
    'aria-label'?: string;
    /** Id of the element naming the group. */
    'aria-labelledby'?: string;
    /** Id of the element describing the control — typically a field's error or hint text. */
    'aria-describedby'?: string;
    /** Marks the text entry invalid for assistive technology. */
    invalid?: boolean;
    /** Id forwarded to the text entry so an external `<label htmlFor>` associates with it. */
    id?: string;
    /** Accessible label for a tag's remove button. Receives the tag's value. */
    removeLabel?: (value: string) => string;
    /**
     * Glyph inside a tag's remove button. Names this one tag group and wins over the provider's
     * `icons.remove`; defaults to a multiplication sign when neither is set. The button, its
     * accessible name and its keyboard behaviour are unaffected.
     */
    removeIcon?: ReactNode;
    /** Extra class name for the root element. */
    className?: string;
    /** Cratis-owned per-part attributes. */
    pt?: TagGroupParts;
}

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

/**
 * A group of removable values with an optional text entry — the control behind a tag or chips field.
 *
 * Every tag is reachable with the arrow keys and removable with Backspace or Delete, which is what
 * the `grid`/`row` semantics React Aria gives a tag group promise; a row of `<span>`s with a close
 * button cannot be operated from the keyboard at all. In the entry, Enter and each configured
 * separator commit the typed value, Backspace on an empty entry removes the last tag, and a pasted
 * string is split on the separators.
 */
export const TagGroup = ({
    value,
    onChange,
    editable = true,
    placeholder,
    separators = [','],
    allowDuplicates = false,
    disabled = false,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    invalid = false,
    id,
    removeLabel,
    removeIcon,
    className,
    pt,
}: TagGroupProps) => {
    const icon = useCratisIcon();
    const resolvedRemoveIcon = icon('remove', '×', removeIcon);
    const generatedId = useId();
    const inputId = id ?? `cratis-tag-group-${generatedId}`;
    const [draft, setDraft] = useState('');

    const add = (candidates: string[]) => {
        const next = [...value];
        for (const candidate of candidates) {
            const trimmed = candidate.trim();
            if (!trimmed) continue;
            if (!allowDuplicates && next.includes(trimmed)) continue;
            next.push(trimmed);
        }
        if (next.length !== value.length) onChange(next);
        setDraft('');
    };

    const remove = (keys: Set<Key>) =>
        onChange(value.filter((entry) => !keys.has(entry)));

    const splitOn = (text: string) =>
        separators.length === 0
            ? [text]
            : text.split(new RegExp(`[${separators.map(escapeForClass).join('')}]`));

    return (
        <div
            {...pt?.root}
            className={classNames('cratis-tag-group', pt?.root?.className, className)}
            data-cratis-part='root'
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
        >
            <AriaTagGroup
                // React Aria renders a wrapper here. It generates a block box, which would trap the
                // tags in their own formatting context — the root's flex layout, and therefore the
                // gap between tags, would never reach them. It has no part on purpose: it is not a
                // styling surface, it just has to disappear from layout.
                className='cratis-tag-group__group'
                selectionMode='none'
                onRemove={remove}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
            >
                <AriaTagList
                    {...pt?.list}
                    items={value.map((entry) => ({ id: entry }))}
                    className={classNames('cratis-tag-group__list', pt?.list?.className)}
                    data-cratis-part='list'
                >
                    {(item: { id: string }) => (
                        <AriaTag
                            {...pt?.tag}
                            id={item.id}
                            textValue={item.id}
                            isDisabled={disabled}
                            className={classNames('cratis-tag-group__tag', pt?.tag?.className)}
                            data-cratis-part='tag'
                            data-disabled={disabled || undefined}
                        >
                            <span className='cratis-tag-group__tag-label'>{item.id}</span>
                            {!disabled && (
                                <AriaButton
                                    {...pt?.remove}
                                    slot='remove'
                                    aria-label={removeLabel?.(item.id)}
                                    className={classNames(
                                        'cratis-tag-group__remove',
                                        pt?.remove?.className,
                                    )}
                                    data-cratis-part='remove'
                                >
                                    <span aria-hidden='true'>{resolvedRemoveIcon}</span>
                                </AriaButton>
                            )}
                        </AriaTag>
                    )}
                </AriaTagList>
            </AriaTagGroup>
            {editable && (
                <input
                    {...pt?.input}
                    id={inputId}
                    type='text'
                    value={draft}
                    disabled={disabled}
                    placeholder={placeholder}
                    aria-label={ariaLabelledBy ? undefined : ariaLabel}
                    aria-labelledby={ariaLabelledBy}
                    aria-describedby={ariaDescribedBy}
                    aria-invalid={invalid || undefined}
                    className={classNames('cratis-tag-group__input', pt?.input?.className)}
                    data-cratis-part='input'
                    data-invalid={invalid || undefined}
                    onChange={(event) => setDraft(event.currentTarget.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || separators.includes(event.key)) {
                            event.preventDefault();
                            add([draft]);
                        } else if (
                            event.key === 'Backspace' &&
                            draft === '' &&
                            value.length > 0
                        ) {
                            onChange(value.slice(0, -1));
                        }
                    }}
                    onPaste={(event) => {
                        const text = event.clipboardData.getData('text');
                        if (!separators.some((separator) => text.includes(separator))) return;
                        event.preventDefault();
                        add(splitOn(text));
                    }}
                    onBlur={() => {
                        if (draft.trim()) add([draft]);
                    }}
                />
            )}
        </div>
    );
};

/** Escapes a separator for use inside a character class, so a `-` or `]` cannot reshape it. */
const escapeForClass = (separator: string) => separator.replace(/[\\\]^-]/gu, '\\$&');
