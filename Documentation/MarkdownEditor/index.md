---
title: MarkdownEditor
description: Write markdown in one bordered box with a formatting toolbar, a preview toggle, configurable autocompletion, and file uploads.
---

`MarkdownEditor` is a controlled markdown editor: a formatting toolbar above the writing area, and a round toggle in the corner that swaps the whole box to the rendered preview. It fills the container it is given, completes whatever triggers you configure, and uploads pasted or dropped files through a callback you supply.

## Basic usage

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

Import the stylesheet once, either the aggregate `@cratis/components/styles` or the area sheet `@cratis/components/MarkdownEditor/styles`.

## Show a preview

The editor ships no markdown renderer. Rendering, and which HTML is allowed through, belongs to your application, so pass the renderer you already use for read-only markdown through `renderPreview`. The toggle appears only when a renderer is given:

```tsx
<MarkdownEditor
    value={description}
    onChange={setDescription}
    renderPreview={markdown => <MarkdownView source={markdown} />}
/>
```

`renderPreview` is never called with empty markdown; the editor shows its `emptyPreview` label instead. Use `initialMode={MarkdownEditorMode.Preview}` to open on the preview.

## Autocomplete a trigger

A completion names what starts it and where its suggestions come from. The editor recognizes the trigger at the caret, waits for typing to pause, calls `suggest`, renders the list at the caret, and writes the picked suggestion's `insertText` over the trigger and the query:

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

- A string `trigger` starts a completion at the start of a line or after whitespace. The query is what follows it on the same line; set `allowSpaces` to search by title rather than a single word.
- A `RegExp` trigger is matched against the current line up to the caret. The whole match is replaced, and the query is the named group `query`, the first group, or the whole match. For example, `/(?<=^|\s)\[\[(?<query>[^\]]*)$/u` completes `[[` wiki links.
- `suggest` may answer synchronously or with a promise. An answer for a query the person has typed past is dropped, the `signal` is aborted when the answer is no longer wanted, and a rejected answer closes the list.
- `debounce` (default `150` milliseconds) and `minimumQueryLength` (default `0`) decide when to ask.
- Each suggestion shows its `detail`, `label` and `annotation`. Use `renderSuggestion` to draw your own content.

The arrow keys move the highlight, Enter or Tab picks it, and Escape dismisses the list until the trigger is typed again. Focus stays in the writing area throughout. The list opens above any dialog the editor sits in and is not hidden or dismissed by it.

## Upload pasted and dropped files

Give `uploadFile` to take over pasted and dropped files. The editor puts a placeholder at the caret straight away, calls `uploadFile`, and replaces the placeholder with the markdown it returns:

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

When the upload rejects, the placeholder is taken out again and `onUploadFailed` is told. A status line announces the files that are uploading, and the root carries `data-busy` while it shows.

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

The same edits are available without the editor through `applyMarkdownFormat(value, selectionStart, selectionEnd, format)`.

## Size

The editor fills the height of its container. When the container leaves its height to its content, the editor falls back to `height`, which is 320 pixels unless you pass another number of pixels or a CSS length. A long document scrolls inside the editor rather than growing it.

## Labels and accessibility

Every label has an English default and can be replaced through `labels`, including the toolbar buttons, the toggle, the empty preview, the suggestion list and the upload status. Name the writing area with `aria-label`, `aria-labelledby`, or a `<label htmlFor>` pointing at `id`. `invalid` sets `aria-invalid`, and `aria-describedby` can point at a validation message.

## Styling

Style the stable parts through `pt` or the `data-cratis-part` attributes: `root`, `toolbar`, `format`, `toggle`, `textarea`, `preview`, `status`, `suggestions` and `suggestion`. The root carries `data-disabled`, `data-invalid`, `data-readonly` and `data-busy`; the toggle carries `data-pressed` while the preview shows; the highlighted suggestion carries `data-selected`. Colors come from the `--cratis-*` tokens.
