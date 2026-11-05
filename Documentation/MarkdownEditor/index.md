---
title: MarkdownEditor — edit markdown in React
description: Use MarkdownEditor to edit markdown in React with controlled state, trigger-based suggestions, pasted or dropped uploads, and your own preview renderer.
---

`MarkdownEditor` from Cratis Components lets people edit a markdown field in your React application while you keep its value in state. It supplies the writing area and formatting toolbar. Your application supplies completion suggestions, file uploads, and a renderer when you want a preview.

## Basic usage

Bind `value` to your markdown string and update it through `onChange`. This makes the editor controlled: your React state holds the text, including changes made by the toolbar.

```tsx
import { useState } from 'react';
import { MarkdownEditor } from '@cratis/components/MarkdownEditor';

export function DescriptionEditor() {
    const [description, setDescription] = useState('');

    return (
        <MarkdownEditor
            value={description}
            onChange={setDescription}
            placeholder='Describe the change'
            aria-label='Description'
        />
    );
}
```

In this example, typing or applying a format updates `description` through `setDescription`. Saving that value belongs to your application's submit or save handler.

Import the stylesheet once, either the aggregate `@cratis/components/styles` or the area sheet `@cratis/components/MarkdownEditor/styles`.

## Show a preview

To let people check the rendered text before saving, pass your markdown renderer through `renderPreview`. The editor has no bundled renderer, so your application decides how markdown is displayed and which HTML is allowed.

The round toggle appears only when `renderPreview` is supplied and switches the whole writing area to the rendered preview. `MarkdownView` below stands for your application's renderer:

```tsx
<MarkdownEditor
    value={description}
    onChange={setDescription}
    renderPreview={markdown => <MarkdownView source={markdown} />}
/>
```

`renderPreview` is not called with empty or whitespace-only markdown; the editor shows its `emptyPreview` label instead. To open on the preview, import `MarkdownEditorMode` from the same package and set `initialMode={MarkdownEditorMode.Preview}`.

## Autocomplete a trigger

Use a completion to help people insert a reference without remembering its identifier. The example below turns `#` followed by an issue search into a list of issue titles. Picking a title inserts its issue number, such as `#42`, into the markdown.

The editor recognizes the trigger at the caret (the text insertion point), waits for typing to pause, and calls `suggest` with the query. Supply your own issue-search endpoint in place of `/api/issues`; `body` and `setBody` represent the same controlled state as in the basic example:

```tsx
import type { MarkdownCompletion } from '@cratis/components/MarkdownEditor';

const issues: MarkdownCompletion = {
    trigger: '#',
    allowSpaces: true,
    label: 'Issues',
    suggest: async (query, { signal }) => {
        const response = await fetch(`/api/issues?search=${encodeURIComponent(query)}`, { signal });
        const found: { number: number; title: string }[] = await response.json();
        return found.map(issue => ({
            id: String(issue.number),
            insertText: `#${issue.number}`,
            label: issue.title,
            detail: `#${issue.number}`,
        }));
    },
};

<MarkdownEditor value={body} onChange={setBody} completions={[issues]} />;
```

Choosing a suggestion replaces the trigger and query with its `insertText`. The title and other display details do not become part of the markdown unless you include them in that string.

- A string `trigger` starts a completion at the start of a line or after whitespace. The query is what follows it on the same line. `allowSpaces` defaults to `false`; set it to `true` to search by title rather than a single word.
- A `RegExp` trigger is matched against the current line up to the caret. The whole match is replaced, and the query is the named group `query`, the first group, or the whole match. For example, `/(?<=^|\s)\[\[(?<query>[^\]]*)$/u` completes `[[` wiki links.
- `suggest` may answer synchronously or with a promise. An answer for a query the person has typed past is dropped, the `signal` is aborted when the answer is no longer wanted, and a rejected answer closes the list.
- `debounce` (default `150` milliseconds) and `minimumQueryLength` (default `0`) decide when to ask.
- Each suggestion shows its `detail`, `label` and `annotation`. Use `renderSuggestion` to draw your own content.

The arrow keys move the highlight, Enter or Tab picks it, and Escape dismisses the list until the trigger is typed again. Focus stays in the writing area throughout. The list opens above any dialog the editor sits in and is not hidden or dismissed by it.

## Upload pasted and dropped files

Supply `uploadFile` when people need to add attachments by pasting or dropping files. The editor inserts a placeholder at the caret for each file, calls your callback, and replaces that placeholder with the markdown the callback returns. You can keep typing while the upload runs.

Your application handles file storage. In this example, `/api/files` represents your upload endpoint, which returns a URL. The callback turns that URL into an image or link:

```tsx
<MarkdownEditor
    value={body}
    onChange={setBody}
    uploadFile={async file => {
        const response = await fetch('/api/files', { method: 'POST', body: file });
        if (!response.ok) throw new Error(response.statusText);
        const { url } = await response.json();
        return file.type.startsWith('image/') ? `![${file.name}](${url})` : `[${file.name}](${url})`;
    }}
    onUploadFailed={file => notify(`Could not upload ${file.name}`)}
/>
```

If an upload rejects, the editor removes its placeholder and calls `onUploadFailed` with the file and error so your application can report the failure. A status line announces the files that are uploading, and the root carries `data-busy` while it shows.

## Formatting

The toolbar offers headings, bold, italic, strikethrough, quotes, inline code, code blocks, links, and bulleted, numbered and task lists. Every format is a toggle: applying it where it is already applied takes it off. Control+B, Control+I and Control+K (Command on macOS) apply bold, italic and a link. The toolbar is one Tab stop; the arrow keys, Home and End move between its buttons.

Choose the formats, in groups, with `formats`, or pass `formats={false}` for no toolbar:

```tsx
import { MarkdownFormat } from '@cratis/components/MarkdownEditor';

<MarkdownEditor
    value={note}
    onChange={setNote}
    formats={[[MarkdownFormat.Bold, MarkdownFormat.Italic], [MarkdownFormat.Link]]}
/>
```

If you need the same formatting in another editing surface, call `applyMarkdownFormat(value, selectionStart, selectionEnd, format)` without mounting the editor. It returns the updated markdown and the selection positions to apply afterward.

## Size

The editor fills the height of its container. When the container leaves its height to its content, the editor falls back to `height`, which is 320 pixels unless you pass another number of pixels or a CSS length. A long document scrolls inside the editor rather than growing it.

## Labels and accessibility

Every label has an English default and can be replaced through `labels`, including the toolbar buttons, the toggle, the empty preview, the suggestion list and the upload status. Name the writing area with `aria-label`, `aria-labelledby`, or a `<label htmlFor>` pointing at `id`. `invalid` sets `aria-invalid`, and `aria-describedby` can point at a validation message.

## Styling

Style the stable parts through `pt` or the `data-cratis-part` attributes: `root`, `toolbar`, `format`, `toggle`, `textarea`, `preview`, `status`, `suggestions` and `suggestion`. The root carries `data-disabled`, `data-invalid`, `data-readonly` and `data-busy`; the toggle carries `data-pressed` while the preview shows; the highlighted suggestion carries `data-selected`. Colors come from the `--cratis-*` tokens. See [Stable component parts](../Styling/pass-through.md) for how to use typed `pt` keys and DOM part attributes.
