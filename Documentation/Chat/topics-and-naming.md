---
title: "Chat topics and naming: create and name conversations"
description: Create Chat topics in your application, return their identifiers to open conversations, and name unnamed topics from the first message.
---

Cratis Components Chat asks your application to create and name topics, then renders the topic data you supply. Return a new topic's identifier to open its conversation. If the topic has no name yet, the chat shows a placeholder until updated data includes one.

In the excerpts below, `sidebarProps` stands for the required `ChatSidebar` props (`open`, `onClose`, `topics`, `messages`, `onSendMessage`) shown in the [basic usage](./index.md#basic-usage).

## The topic interface

```typescript
interface ChatTopic {
    id: ChatIdentifier;
    name?: string; // unset or blank while not named yet
    startedBy?: ChatIdentifier; // resolved through authorOf at render time
    started?: Date;
    lastActivity?: Date; // orders the list; falls back to started
    metadata?: Record<string, unknown>;
}
```

The list shows the most recently active topics first, using `lastActivity` or falling back to `started`. Supply topics in any order. `topicsByActivity` is exported if your application needs the same ordering elsewhere.

## ChatTopicList props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `topics`, `onOpen` | `TTopic[]`, `(topic: TTopic) => void` | Required | Topics and the callback for opening one. |
| `onStart` | `() => void` | — | Shows the new-topic button when supplied. |
| `topicActions` | `ChatTopicAction<TTopic>[]` | — | Host actions beside topics where they are available. See [Topic actions](./topic-actions.md). |
| `status` | `ChatStatus` | `Ready` | List query display state. |
| `authorOf`, `renderAvatar`, `buildAvatarUrl` | callbacks | — | Resolve and render the topic starter. |
| `isTopicUnnamed` | `(topic: TTopic) => boolean` | Blank name | Decides when to show the pending placeholder. |
| `labels`, `className` | `ChatTopicListLabels`, `string` | — | Label overrides and root class name. |

## Starting a topic

Create the topic in `onStartTopic` and return its id, directly or through a promise, to open the conversation. Return `undefined` to leave selection unchanged. Your application must also include the created topic in `topics`; returning its id does not add it to the array.

```tsx
import { Guid } from '@cratis/fundamentals';

<ChatSidebar
    {...sidebarProps}
    onStartTopic={async () => {
        const topicId = Guid.create();
        await createTopic(topicId);        // your command, your storage
        return topicId;
    }}
/>
```

Omit `onStartTopic` to hide the new-topic button. Messages sent in the open conversation call `onSendMessage(topicId, body, mentions)`. Store the message in that handler and supply it through `messages`; the sidebar does not keep a separate copy of your data.

## Host-side auto-naming

An unnamed topic displays a pending placeholder in the list and conversation title. The default text is `New topic`, which you can override through labels. To name the topic from its first message, supply `onRequestTopicName(topic, firstMessageBody)`. Your handler derives and stores the name, using a large language model (LLM) or another naming rule; the chat displays it when updated topic data arrives.

The sidebar decides whether to request a name from your data at send time. It calls the handler only when the open topic is present in `topics`, is unnamed, and has no messages for that topic in the supplied `messages` array. A topic that already has a name or messages does not trigger the request. The exported `shouldRequestTopicName` helper exposes the unnamed-and-no-messages check.

The naming callback runs after `onSendMessage`, without waiting for persistence. If another send happens before your message data updates, the sidebar can request a name again. Make your handler safe to call more than once, and supply a newly created topic before its first message is likely to be sent.

```tsx
<ChatSidebar
    {...sidebarProps}
    onRequestTopicName={async (topic, firstMessage) => {
        const name = await askLlmForTopicName(firstMessage);   // your model, your prompt
        await renameTopic(topic.id, name);                     // your command — flows back in via the data
    }}
/>
```

The placeholder reflects topic data, not progress reported by the naming handler. If naming fails or is unavailable, your application can supply a fallback name or offer manual naming through a [topic action](./topic-actions.md).

## When "unnamed" means something else

By default, a missing or whitespace-only name counts as unnamed. If your backend stores a literal placeholder, override `isTopicUnnamed` and the displayed label:

```tsx
<ChatSidebar
    {...sidebarProps}
    isTopicUnnamed={topic => topic.name === 'New topic'}
    labels={{ unnamedTopic: 'Naming…' }}
/>
```

## Owning the selection

Omit `selectedTopicId` to let the sidebar manage which topic is open. To drive selection from application state, such as a URL parameter, pass `selectedTopicId` and update that state in `onTopicSelected(topicId, topic)`. Pass `null` to show the topics list; the callback receives `undefined` when someone goes back to it.

If you want the sidebar to manage both selection and Cratis Arc subscriptions, use the [observable-query wrapper](./observable-queries.md). That wrapper owns selection and does not accept `selectedTopicId`.
