// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MarkdownEditor, type MarkdownEditorProps } from './MarkdownEditor';
import type { MarkdownCompletion } from './MarkdownCompletion';
import type { MarkdownSuggestion } from './MarkdownSuggestion';
import { MarkdownFormat } from './MarkdownFormat';

const sampleMarkdown = `## Example Project

Write **markdown** here and press the round button to see it rendered.

- Paste or drop a file to upload it
- Type \`#\` to reference an issue
`;

/**
 * A deliberately small renderer for the stories: headings, list items and paragraphs as plain text.
 * The editor ships no renderer - a host passes its own, sanitized one through `renderPreview`.
 */
const renderSample = (markdown: string): ReactNode => (
    <div className='story-markdown-preview'>
        {markdown.split('\n').filter(line => line.trim().length > 0).map((line, index) => {
            const key = `${index}-${line}`;
            if (line.startsWith('## ')) return <h3 key={key}>{line.slice(3)}</h3>;
            if (line.startsWith('# ')) return <h2 key={key}>{line.slice(2)}</h2>;
            if (line.startsWith('- ')) return <p key={key}>• {line.slice(2)}</p>;
            return <p key={key}>{line}</p>;
        })}
    </div>
);

const sampleIssues: MarkdownSuggestion[] = [
    { id: '101', insertText: 'example/project#101', label: 'Add sample export', detail: 'example/project#101', annotation: 'Issue' },
    { id: '102', insertText: 'example/project#102', label: 'Fix sample import', detail: 'example/project#102', annotation: 'Pull request' },
    { id: '103', insertText: 'example/project#103', label: 'Document sample settings', detail: 'example/project#103', annotation: 'Issue' },
];

const issueCompletion: MarkdownCompletion = {
    trigger: '#',
    allowSpaces: true,
    label: 'Issues and pull requests',
    suggest: query =>
        new Promise(resolve =>
            setTimeout(
                () => resolve(sampleIssues.filter(issue => `${issue.id} ${issue.label}`.toLowerCase().includes(query.toLowerCase()))),
                100,
            ),
        ),
};

const Editor = (props: Omit<MarkdownEditorProps, 'value' | 'onChange'> & { initialValue?: string }) => {
    const { initialValue = sampleMarkdown, ...rest } = props;
    const [value, setValue] = useState(initialValue);
    return (
        <div style={{ width: 'min(40rem, 90vw)' }}>
            <MarkdownEditor {...rest} value={value} onChange={setValue} />
        </div>
    );
};

const meta = {
    title: 'MarkdownEditor/MarkdownEditor',
    component: Editor,
    args: {
        renderPreview: renderSample,
        placeholder: 'Write markdown…',
        'aria-label': 'Description',
    },
    parameters: { layout: 'centered' },
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Show preview' }));
        await expect(await canvas.findByText('Example Project')).toBeTruthy();
        await userEvent.click(canvas.getByRole('button', { name: 'Show markdown' }));
        await expect(canvas.getByRole('textbox', { name: 'Description' })).toBeTruthy();
    },
};

export const WithCompletion: Story = {
    args: {
        initialValue: 'Related to ',
        completions: [issueCompletion],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const textbox = canvas.getByRole('textbox', { name: 'Description' });
        await userEvent.click(textbox);
        await userEvent.keyboard('{End}#export');
        const body = within(canvasElement.ownerDocument.body);
        await waitFor(() => expect(body.getByRole('listbox', { name: 'Issues and pull requests' })).toBeTruthy());
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect((textbox as HTMLTextAreaElement).value).toBe('Related to example/project#101'));
    },
};

export const WithUploads: Story = {
    args: {
        initialValue: 'Paste or drop a file here.\n',
        uploadFile: (file: File) =>
            new Promise<string>(resolve =>
                setTimeout(() => resolve(`[${file.name}](https://example.invalid/files/${encodeURIComponent(file.name)})`), 1500),
            ),
    },
};

export const WithSelectedFormats: Story = {
    args: {
        formats: [[MarkdownFormat.Bold, MarkdownFormat.Italic], [MarkdownFormat.Link]],
    },
};

export const WithoutToolbar: Story = {
    args: {
        formats: false,
        height: 160,
    },
};

export const Invalid: Story = {
    args: {
        invalid: true,
        initialValue: '',
    },
};

export const ReadOnly: Story = {
    args: {
        readOnly: true,
    },
};
