---
title: "Cratis Components Chat: add topic-based conversations"
description: Cratis Components Chat keeps conversations beside your application's work, with topics, messages, naming, and actions owned by your application.
---

Cratis Components Chat adds topic-based conversations beside an application's main view. Your application supplies topics and messages and handles sending, naming, and actions; the components render the topic list, conversation, and composer. Use it when people need to discuss the work without leaving the page.

## Purpose

Your application remains the source of truth. Pass topics and messages as arrays, whether they come from local state or a live query that pushes updated data. When someone sends a message or starts a topic, the chat calls your handler. Your application stores the change and supplies the updated arrays for the chat to render.

`ChatMessage` defines the fields the conversation needs, with optional mentions and metadata. Extend that interface with identifiers or other data your application uses. The components preserve your message type, so an action receives the full message without a separate lookup.

## Key Features

`ChatSidebar` opens on the right by default, with a topics list and a conversation for the selected topic. Its default non-modal panel leaves the page behind usable. Set `modal` when the conversation should block the page and close on Escape or an outside click.

The composer supports `@`-mentions of people and agents from your candidate list or lookup callback, plus an emoji picker with recently used emoji. Your application resolves author names and avatars, supplies message and topic actions, and names new topics. While a name is pending, the chat displays a placeholder; when updated topic data arrives, it displays the name.

Chat colors use the `--cratis-*` tokens so the conversation follows the application's theme.

## Components

| Component                         | What it is                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `ChatSidebar`                     | Sidebar panel with topic selection, conversations, back navigation, and naming callbacks |
| `ChatTopicList`                   | Topic list with controls to open a conversation or start a topic                                                       |
| `ChatConversation`                | Messages and composer for one conversation                                                    |
| `ChatMessageBody`                 | Plain message text with known `@`-mentions marked for styling                                     |
| `ChatSidebarForObservableQueries` | Optional: `ChatSidebar` bound to two Cratis Arc observable queries                                |

## Requirements

Import every Chat component and type from `@cratis/components/Chat`. You can use `ChatSidebar` with your own data source; the [Cratis Arc query wrapper](./observable-queries.md) is optional. The Chat subpath also exports that wrapper and imports `@cratis/arc.react`, so the peer packages (`@cratis/arc`, `@cratis/arc.react`, `@cratis/fundamentals`) are required either way. Only the wrapper needs Arc's `<Arc>` provider at runtime.

Chat labels are English by default and come from each component's `labels` prop, not from the `messages` of `CratisComponentsProvider`. Localize them through `labels` on `ChatSidebar` or `ChatConversation`.

## Basic Usage

```tsx
import { useState } from 'react';
import {
    ChatSidebar,
    ChatAuthorKind,
    type ChatAuthor,
    type ChatIdentifier,
} from '@cratis/components/Chat';

const authorOf = (authorId: ChatIdentifier): ChatAuthor =>
    teamMembers.get(String(authorId)) ?? {
        name: String(authorId),
        kind: ChatAuthorKind.User,
    };

export const Workspace = () => {
    const [chatOpen, setChatOpen] = useState(false);
    const { topics, messages } = useMyChatData(); // however your app gets its live data

    return (
        <>
            <button type='button' onClick={() => setChatOpen(true)}>Chat</button>
            <ChatSidebar
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                topics={topics}
                messages={messages}
                authorOf={authorOf}
                onStartTopic={() => startTopic()} // create it, answer its id
                onSendMessage={(topicId, body, mentions) => send(topicId, body, mentions)}
                onRequestTopicName={(topic, firstMessage) =>
                    nameTopic(topic, firstMessage)
                }
                mentionCandidates={candidates}
            />
        </>
    );
};
```

`teamMembers`, `useMyChatData`, `startTopic`, `send`, `nameTopic`, and `candidates` stand for your application's own data and commands.

`messages` may contain the whole chat or just the open topic's messages. The sidebar filters by `topicId` and preserves their array order, so supply messages in the order they should appear. Sending calls your handler; the message appears when your application includes it in this data.

Next, wire [topic creation and naming](./topics-and-naming.md) so a new conversation opens with the identifier your application created.

## ChatSidebar props

| Prop                                     | Type                                          | Default   | Behavior                                                                                             |
| ---------------------------------------- | --------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `open` / `onClose`                       | `boolean`, `() => void`                       | Required  | The host owns the open state; the close button calls `onClose`.                                      |
| `topics` / `messages`                    | `TTopic[]`, `TMessage[]`                      | Required  | Topics are sorted by activity; messages keep their array order. See [Topics and naming](./topics-and-naming.md).                             |
| `topicsStatus` / `messagesStatus`        | `ChatStatus`                                  | `Ready`   | Optional independent states for the list and conversation. See [Query display states](#query-display-states). |
| `onSendMessage`                          | `(topicId, body, mentions) => void`           | Required  | Receives the trimmed body and who it mentions.                                                       |
| `onStartTopic`                           | `() => ChatIdentifier \| undefined \| Promise` | —         | Enables the new-topic affordance; answer the new topic's id to open it.                              |
| `onRequestTopicName` / `isTopicUnnamed`  | callbacks                                     | —         | The host-side naming contract.                                                                       |
| `selectedTopicId` / `onTopicSelected`    | `ChatIdentifier \| null`, callback            | Internal  | Owns or observes the open topic.                                                                     |
| `authorOf`, `renderAvatar`, `renderAuthorName`, `buildAvatarUrl` | callbacks             | —         | Author resolution and rendering. Without `authorOf`, the id is shown as the name.                    |
| `renderMessageExtra`                                              | `(message) => ReactNode` | —      | Content rendered under a message's body, such as reactions or a failed-reply notice.                 |
| `renderHeaderActions`                                             | `(openTopic) => ReactNode` | —    | Content rendered in the header between the title and the close button, such as a rename control.     |
| `actions`, `quickReply`                  | `ChatMessageAction[]`, `boolean`              | —, `true` | Message actions and quick reply; see [Message actions](./message-actions.md).                         |
| `topicActions`                           | `ChatTopicAction<TTopic>[]`                   | —         | Actions beside available topics; see [Topic actions](./topic-actions.md).                             |
| `mentionCandidates` / `resolveMentionCandidates` | array or callback                     | —         | See [Mentions and emoji](./mentions-and-emoji.md). Omit both to turn mentions off.                   |
| `typingAuthors`                          | `ChatTypingAuthor[]`                          | `[]`      | Who the conversation is waiting on.                                                                  |
| `autoFocus`                              | `boolean`                                     | `false`   | Focuses the composer when a conversation mounts.                                                     |
| `position` / `width`                     | `'left' \| 'right'`, CSS length               | `right`, `24rem` | Edge and width of the panel.                                                                  |
| `modal`                                  | `boolean`                                     | `false`   | Adds a blocking backdrop with Escape and outside-click dismissal.                                    |
| `labels`, `className`, `pt`              | `ChatSidebarLabels`, `string`, `ChatSidebarParts` | —     | English label overrides, panel class, and stable parts.                                              |

## Query display states

If your application owns the queries, import `ChatStatus` from `@cratis/components/Chat` and pass `topicsStatus` and `messagesStatus` to `ChatSidebar`. Both default to `ChatStatus.Ready`, so an empty array shows the ordinary empty-state text unless you supply another status. The standalone `ChatTopicList` and `ChatConversation` accept the same optional enum through their `status` prop.

| Status | Without topics or messages | With existing topics or messages |
| ------ | -------------------------- | -------------------------------- |
| `ChatStatus.Ready` | Ordinary empty-state text | Existing content |
| `ChatStatus.Loading` | Loading text with a status announcement | Existing content remains visible during a refetch |
| `ChatStatus.Failed` | Failure text with an alert | Failure alert above the existing content; topics or messages remain visible |
| `ChatStatus.Unauthorized` | Access-denied text with an alert | Access-denied alert replaces the content |

`topicsStatus={ChatStatus.Unauthorized}` disables the new-topic button; `messagesStatus={ChatStatus.Unauthorized}` disables the conversation composer, even if a draft was already started. The close and back buttons remain available.

Override these messages with `labels.topicList.loading`, `.failed`, or `.unauthorized` for topics, and `labels.conversation.loading`, `.failed`, or `.unauthorized` for messages. Unset fields use English defaults; the existing `empty` labels still apply to successful empty results. Chat labels do not come from `CratisComponentsProvider.messages`. The [observable-query wrapper](./observable-queries.md#loading-and-failed-queries) resolves statuses for you.

## Focus and dismissal

The default, non-modal sidebar is a plain panel with an `h2` title. It portals to `document.body` after mount, or to the container supplied by the provider's `overlayEnvironment`. If that container is unavailable, the portal waits and checks again on the next render while open; server rendering produces no panel markup, so hydration does not mismatch. The panel slides in and out on open and close, except when reduced motion is requested.

It does not move focus when it opens, trap focus, or close on Escape or an outside click, so the page behind stays usable. Move focus into it yourself when it opens from a keyboard action, or pass `autoFocus` to focus the composer when a conversation mounts.

With `modal`, the panel renders through React Aria's modal overlay: a backdrop blocks the page, and Escape or a press outside the panel calls `onClose`.

## The message interface

```typescript
interface ChatMessage {
    id: ChatIdentifier;
    topicId: ChatIdentifier;
    authorId: ChatIdentifier;
    body: string; // mentions appear in it as plain `@Name`
    timestamp: Date;
    mentions?: ChatMention[]; // who the body mentions
    metadata?: Record<string, unknown>; // whatever else your shape carries
}
```

`ChatIdentifier` accepts a string or a value with `toString()` (a `Guid`, a number, or a custom id type). The components compare identifiers by that string form. Other message fields still need to match `ChatMessage`.

Extend the interface for what your actions need; the components are generic over it:

```tsx
interface ProjectMessage extends ChatMessage {
    projectId: string;
}

<ChatSidebar<ProjectMessage>
    {...sidebarProps} // open, onClose, topics, messages, onSendMessage as in Basic usage
    actions={[{
        id: 'open-project',
        label: 'Open the project',
        icon: <FaFolderOpen />, // or a CSS class name for an icon font your app already uses
        onInvoke: message => navigate(`/projects/${message.projectId}`),
    }]}
/>
```

Pass `icon` as a React element or a CSS class name for an icon font your application provides. Chat does not require a particular icon library.

## Authors are resolved, not stored

A message identifies its author through `authorId`. The `authorOf` callback resolves that id to a `ChatAuthor` (`name`, `kind`, `hasAvatar`, `avatarVersion`, `initials`) at render time. Supply updated author data through that callback to show a changed name or avatar without rewriting stored messages.

The built-in avatar shows initials on a color derived from the id. It shows an image only when you pass `buildAvatarUrl` and the author has `hasAvatar: true`; Components has no avatar endpoint of its own and fetches nothing without it. An image that fails to load falls back to initials. For full control, `renderAvatar` and `renderAuthorName` replace the built-in avatar circle and name text entirely:

```tsx
<ChatConversation
    messages={messages}
    onSendMessage={send}
    authorOf={authorOf}
    renderAvatar={(authorId, author) => <MyAvatar id={authorId} title={author.name} />}
    renderAuthorName={(authorId, author) => (
        <MyProfileLink id={authorId}>{author.name}</MyProfileLink>
    )}
/>
```

## Add your own content to messages and the header

Use render callbacks when a message needs content beyond its text and action buttons. `renderMessageExtra` renders content under each message's body: reactions, a notice for a reply that failed, or anything else keyed off your own message type. `ChatSidebar` forwards it to the conversation. `renderHeaderActions` renders content in the sidebar header, next to the title; it receives the open topic, or `undefined` while the topic list is shown. Returning `null` renders nothing, and the chat's markup is unchanged when you leave both unset.

```tsx
type AppMessage = ChatMessage & { failed?: boolean; reactions?: string[] };

<ChatSidebar<AppMessage>
    renderMessageExtra={(message) =>
        message.failed ? <p role='status'>The agent could not answer.</p> :
        message.reactions?.length ? <MyReactions reactions={message.reactions} /> : null}
    renderHeaderActions={(openTopic) =>
        openTopic ? <MyRenameButton topic={openTopic} /> : null}
    /* ...the rest of your props */
/>
```

`MyReactions` and `MyRenameButton` are your own components. The content you render keeps its own semantics and styling; give interactive controls accessible names.

## Rendering a message body directly

`ChatConversation` uses `ChatMessageBody` internally. Import it directly when an application-owned message list, notification, or transcript needs the same mention rendering without the rest of the conversation UI.

```tsx
import { ChatMessageBody, ChatAuthorKind } from '@cratis/components/Chat';

<ChatMessageBody
    body='Ask @Review Bot about this change.'
    mentions={[
        {
            id: 'review-bot',
            name: 'Review Bot',
            kind: ChatAuthorKind.Agent,
        },
    ]}
/>;
```

| Prop       | Type            | Description                                                                                  |
| ---------- | --------------- | -------------------------------------------------------------------------------------------- |
| `body`     | `string`        | Plain message text. Mention names remain ordinary `@Name` text in the stored body.           |
| `mentions` | `ChatMention[]` | Known mentions to mark within the text. Omit it when the body contains no resolved mentions. |

The component renders text, not HTML or Markdown. Each resolved mention gets the `cratis-chat-message__mention` class and a `data-kind` attribute so people and agents can be styled differently. Text that does not match a supplied mention remains unchanged.

## Styling

Import `@cratis/components/styles`, or `@cratis/components/Chat/styles` if you use per-area stylesheets, for the chat layout. Chat uses `--cratis-*` tokens for theme colors, including light, dark, and application overrides.

To customize specific parts, pass `pt` to `ChatSidebar`. Its `ChatSidebarParts` type accepts attributes such as `className`, `style`, and `data-*` for the backdrop, root panel, header, title, back and close buttons, and content region.

## See also

- [Topics and naming](./topics-and-naming.md) — the topic lifecycle and the host-side auto-naming contract
- [Mentions and emoji](./mentions-and-emoji.md) — candidate providers, how mentions travel and render
- [Message actions](./message-actions.md) — offering your own actions on messages
- [Topic actions](./topic-actions.md) — offering your own actions on topics
- [Observable queries](./observable-queries.md) — the optional Arc-aware wrapper
