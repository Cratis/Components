// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MarkdownEditor, type MarkdownEditorProps } from '../../MarkdownEditor';

/**
 * An editor mounted into a real document, holding its markdown the way a host does.
 */
export interface EditorInTheDom {
    /** The element the editor is rendered into. */
    container: HTMLDivElement;

    /** The React root rendering it. */
    root: Root;

    /** Every value the editor reported through `onChange`, in order. */
    changes: string[];

    /** The editor's writing area, while the markdown is showing. */
    textarea: () => HTMLTextAreaElement;
}

type HostProps = Omit<MarkdownEditorProps, 'value' | 'onChange'> & {
    initialValue: string;
    changes: string[];
};

const Host = ({ initialValue, changes, ...props }: HostProps) => {
    const [value, setValue] = useState(initialValue);
    return createElement(MarkdownEditor, {
        ...props,
        value,
        onChange: (next: string) => {
            changes.push(next);
            setValue(next);
        },
    });
};

/**
 * Renders a {@link MarkdownEditor} whose markdown is held by a host.
 * @param initialValue The markdown to start with.
 * @param props The rest of the editor's props.
 * @returns The mounted editor.
 */
export const renderEditor = async (
    initialValue: string,
    props: Omit<MarkdownEditorProps, 'value' | 'onChange'> = {},
): Promise<EditorInTheDom> => {
    // SAFETY: React reads this process-wide test flag from globalThis.
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const changes: string[] = [];

    await act(async () => {
        root.render(createElement(Host, { ...props, initialValue, changes }));
    });

    return {
        container,
        root,
        changes,
        textarea: () => container.querySelector<HTMLTextAreaElement>('[data-cratis-part="textarea"]')!,
    };
};

/**
 * Unmounts an editor rendered with {@link renderEditor}.
 * @param editor The mounted editor.
 */
export const unmount = async (editor: EditorInTheDom) => {
    await act(async () => editor.root.unmount());
    editor.container.remove();
};

/**
 * Types markdown into a textarea the way the browser reports it to React, leaving the caret at the end.
 * @param textarea The textarea to type into.
 * @param value The markdown it should hold.
 */
export const typeInto = async (textarea: HTMLTextAreaElement, value: string) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
    await act(async () => {
        setter.call(textarea, value);
        textarea.setSelectionRange(value.length, value.length);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
};

/**
 * Selects a range in a textarea and lets React see the selection move.
 * @param textarea The textarea.
 * @param start Where the selection starts.
 * @param end Where the selection ends.
 */
export const select = async (textarea: HTMLTextAreaElement, start: number, end: number) => {
    await act(async () => {
        textarea.focus();
        textarea.setSelectionRange(start, end);
        textarea.dispatchEvent(new Event('select', { bubbles: true }));
    });
};

/**
 * Presses a key in an element.
 * @param element The element with focus.
 * @param key The key.
 * @param modifiers Modifier keys held down.
 */
export const press = async (element: HTMLElement, key: string, modifiers: KeyboardEventInit = {}) => {
    await act(async () => {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers }));
    });
};

/**
 * Clicks an element.
 * @param element The element to click.
 */
export const click = async (element: HTMLElement) => {
    await act(async () => element.click());
};

/**
 * Lets pending timers and promises settle, such as a completion's debounce.
 * @param milliseconds How long to wait.
 */
export const settle = async (milliseconds = 10) => {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, milliseconds));
    });
};
