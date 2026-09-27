---
title: Chat
description: Build topic-based chat with host-owned data, mentions, emoji, and message actions.
---

The `Chat` components give an application a topic-based chat that opens in a sidebar next to the view — a topics list, the conversation for the picked topic, `@`-mentions of people and agents, emoji, and per-message actions — without the library holding any opinion about where the data lives or what a backend looks like.

## Purpose

Everything about _data_ stays with your application:

- **Topics and messages come in as plain arrays.** Hand the components the data a live (observable) query delivers and they re-render as it changes.
- **Everything going out is a callback.** Sending a message, starting a topic, naming a topic, resolving an author, offering actions — the components raise intents; your application decides what they mean.
- **Messages are an interface, not a class.** `ChatMessage` declares the minimum (`id`, `topicId`, `authorId`, `body`, `timestamp`, `mentions`, `metadata`), the components are generic over your own extended type, and every action callback receives your full message back.

## Key Features

- Sidebar opening beside the view (right by default), with a topics list and per-topic conversations. By default it is non-modal: the page behind stays visible and usable, and only its close and back buttons dismiss it. Set `modal` for a backdrop with Escape and outside-click dismissal
- Host-side topic auto-naming contract with a pending placeholder until the name arrives
- `@`-mentions from a list you hold or a provider callback you resolve, rendered distinctly in message bodies
- Emoji picker in the composer, with a quick row of recently used emoji
- Host-supplied render callbacks for avatars and display names — messages carry only the author id
- Extensible per-message actions shown on hover or keyboard focus
- Every color from the `--cratis-*` token seam, so the chat follows your theme

## Components

| Component                         | What it is                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `ChatSidebar`                     | The whole thing in an overlay panel: topics list ⇄ conversation, back navigation, naming contract |
| `ChatTopicList`                   | Just the topics — pick one, start a new one                                                       |
| `ChatConversation`                | Just one conversation — messages plus composer                                                    |
| `ChatMessageBody`                 | Plain message text with known `@`-mentions marked for styling                                     |
| `ChatSidebarForObservableQueries` | Optional: `ChatSidebar` bound to two Cratis Arc observable queries                                |

## Requirements

Import every Chat component and type from `@cratis/components/Chat`. The subpath also exports the optional Arc wrapper, so it imports `@cratis/arc.react` even when you only use `ChatSidebar`: install the Arc peers (`@cratis/arc`, `@cratis/arc.react`, `@cratis/fundamentals`) either way. Only the wrapper needs Arc's `<Arc>` provider at runtime.

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

`messages` may be the whole chat or just the open topic's — the sidebar shows the open topic's messages by matching on `topicId` either way.

## ChatSidebar props

| Prop                                     | Type                                          | Default   | Behavior                                                                                             |
| ---------------------------------------- | --------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `open` / `onClose`                       | `boolean`, `() => void`                       | Required  | The host owns the open state; the close button calls `onClose`.                                      |
| `topics` / `messages`                    | `TTopic[]`, `TMessage[]`                      | Required  | The data, in any order. See [Topics and naming](./topics-and-naming.md).                             |
| `topicsStatus` / `messagesStatus`        | `ChatStatus`                                  | `Ready`   | Optional independent states for the list and conversation. See [Query display states](#query-display-states). |
| `onSendMessage`                          | `(topicId, body, mentions) => void`           | Required  | Receives the trimmed body and who it mentions.                                                       |
| `onStartTopic`                           | `() => ChatIdentifier \| undefined \| Promise` | —         | Enables the new-topic affordance; answer the new topic's id to open it.                              |
| `onRequestTopicName` / `isTopicUnnamed`  | callbacks                                     | —         | The host-side naming contract.                                                                       |
| `selectedTopicId` / `onTopicSelected`    | `ChatIdentifier \| null`, callback            | Internal  | Owns or observes the open topic.                                                                     |
| `authorOf`, `renderAvatar`, `renderAuthorName`, `buildAvatarUrl` | callbacks             | —         | Author resolution and rendering. Without `authorOf`, the id is shown as the name.                    |
| `actions`, `quickReply`                  | `ChatMessageAction[]`, `boolean`              | —, `true` | See [Message actions](./message-actions.md).                                                         |
| `mentionCandidates` / `resolveMentionCandidates` | array or callback                     | —         | See [Mentions and emoji](./mentions-and-emoji.md). Omit both to turn mentions off.                   |
| `typingAuthors`                          | `ChatTypingAuthor[]`                          | `[]`      | Who the conversation is waiting on.                                                                  |
| `autoFocus`                              | `boolean`                                     | `false`   | Focuses the composer when a conversation mounts.                                                     |
| `position` / `width`                     | `'left' \| 'right'`, CSS length               | `right`, `24rem` | Edge and width of the panel.                                                                  |
| `modal`                                  | `boolean`                                     | `false`   | Adds a blocking backdrop with Escape and outside-click dismissal.                                    |
| `labels`, `className`, `pt`              | `ChatSidebarLabels`, `string`, `ChatSidebarParts` | —     | English label overrides, panel class, and stable parts.                                              |

## Query display states

If your application owns the queries, import `ChatStatus` from `@cratis/components/Chat` and pass `topicsStatus` and `messagesStatus` to `ChatSidebar`. Both default to `ChatStatus.Ready`, so omitting them preserves the existing empty states. The standalone `ChatTopicList` and `ChatConversation` accept the same optional enum through their `status` prop.

| Status | Without topics or messages | With existing topics or messages |
| ------ | -------------------------- | -------------------------------- |
| `ChatStatus.Ready` | Ordinary empty-state text | Existing content |
| `ChatStatus.Loading` | Loading text with a status announcement | Existing content remains visible during a refetch |
| `ChatStatus.Failed` | Failure text with an alert | Failure alert above the existing content; topics or messages remain visible |
| `ChatStatus.Unauthorized` | Access-denied text with an alert | Access-denied alert replaces the content |

While access is denied, the new-topic button and conversation composer are disabled, even if a draft was already started. The close and back buttons remain available.

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

`ChatIdentifier` accepts a string or anything that renders itself as one (a `Guid`, a number, a custom id type) — the components never look past its string form, so query results plug in without mapping.

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

`icon` is opaque to the library — a ready element (as above) or a CSS class name string for
whatever icon font the host provides. The chat itself does not depend on any icon library.

## Authors are resolved, not stored

A message deliberately carries only `authorId`. The `authorOf` callback resolves it to a `ChatAuthor` (`name`, `kind`, `hasAvatar`, `avatarVersion`, `initials`) at render time — so a rename or a new picture shows up everywhere at once.

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

Import `@cratis/components/styles` (or, with per-area stylesheets, `@cratis/components/Chat/styles`) for the chat's layout. Every color comes from the `--cratis-*` token layer, so the chat follows whatever theme the application runs — light, dark, or its own overrides. `ChatSidebar` accepts a `pt` prop typed as `ChatSidebarParts` — per-part attributes (`className`, `style`, `data-*`, and more) for its backdrop, root panel, header, title, back/close buttons, and content region — for full control over structure and styling.

## See also

- [Topics and naming](./topics-and-naming.md) — the topic lifecycle and the host-side auto-naming contract
- [Mentions and emoji](./mentions-and-emoji.md) — candidate providers, how mentions travel and render
- [Message actions](./message-actions.md) — offering your own actions on messages
- [Observable queries](./observable-queries.md) — the optional Arc-aware wrapper
