# Chat

The `Chat` components give an application a topic-based chat that opens in a sidebar next to the view — a topics list, the conversation for the picked topic, `@`-mentions of people and agents, emoji, and per-message actions — without the library holding any opinion about where the data lives or what a backend looks like.

## Purpose

Everything about _data_ stays with your application:

- **Topics and messages come in as plain arrays.** Hand the components the data a live (observable) query delivers and they re-render as it changes.
- **Everything going out is a callback.** Sending a message, starting a topic, naming a topic, resolving an author, offering actions — the components raise intents; your application decides what they mean.
- **Messages are an interface, not a class.** `ChatMessage` declares the minimum (`id`, `topicId`, `authorId`, `body`, `timestamp`, `mentions`, `metadata`), the components are generic over your own extended type, and every action callback receives your full message back.

## Key Features

- Sidebar (an overlay panel with documented focus and dismissal behavior, built on Components' own React Aria-based primitives) opening to the right of the view, with a topics list and per-topic conversations
- Host-side topic auto-naming contract with a pending placeholder until the name arrives
- `@`-mentions from a list you hold or a provider callback you resolve, rendered distinctly in message bodies
- Emoji picker in the composer, with a quick row of recently used emoji
- Host-supplied render callbacks for avatars and display names — messages carry only the author id
- Extensible per-message actions shown on hover
- Every color from the `--cratis-*` token seam, so the chat follows your theme

## Components

| Component                         | What it is                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `ChatSidebar`                     | The whole thing in an overlay panel: topics list ⇄ conversation, back navigation, naming contract |
| `ChatTopicList`                   | Just the topics — pick one, start a new one                                                       |
| `ChatConversation`                | Just one conversation — messages plus composer                                                    |
| `ChatSidebarForObservableQueries` | Optional: `ChatSidebar` bound to two Cratis Arc observable queries                                |

## Basic Usage

```tsx
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
            <button onClick={() => setChatOpen(true)}>Chat</button>
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

`messages` may be the whole chat or just the open topic's — the sidebar shows the open topic's messages by matching on `topicId` either way.

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
    ...
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

A message deliberately carries only `authorId`. The `authorOf` callback resolves it to a `ChatAuthor` (`name`, `kind`, `hasAvatar`, `avatarVersion`) at render time — so a rename or a new picture shows up everywhere at once. For full control, `renderAvatar` and `renderAuthorName` replace the built-in avatar circle and name text entirely:

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

## Styling

Every color comes from the `--cratis-*` token layer, so the chat follows whatever theme the application runs — light, dark, or its own overrides. `ChatSidebar` accepts a `pt` prop typed as `ChatSidebarParts` — per-part attributes (`className`, `style`, `data-*`, and more) for its backdrop, root panel, header, title, back/close buttons, and content region — for full control over structure and styling.

## See also

- [Topics and naming](./topics-and-naming.md) — the topic lifecycle and the host-side auto-naming contract
- [Mentions and emoji](./mentions-and-emoji.md) — candidate providers, how mentions travel and render
- [Message actions](./message-actions.md) — offering your own actions on messages
- [Observable queries](./observable-queries.md) — the optional Arc-aware wrapper
