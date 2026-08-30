# Topics and naming

A chat is a set of topics — separate conversations, most recently active first. This page covers the topic lifecycle: what a topic is to the components, how one is started, and how a new topic gets its name from the host.

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

The list orders topics by `lastActivity` (falling back to `started`) itself — hand it topics in any order.

## Starting a topic

`onStartTopic` raises the intent; creating the topic is the application's business. Answer with the new topic's id — directly or through a promise — and the sidebar opens it, ready for the first message:

```tsx
<ChatSidebar
    ...
    onStartTopic={async () => {
        const topicId = Guid.create();
        await createTopic(topicId);        // your command, your storage
        return topicId;
    }}
/>
```

Omit `onStartTopic` to leave the new-topic affordance off entirely.

## Host-side auto-naming

A topic is not named by the components — it is named by the host, typically by asking an LLM for a good title once there is a first message to derive it from. The contract:

1. A topic without a usable `name` counts as **unnamed**. It renders a placeholder (`New topic`, overridable through labels) in a pending style — in the topics list and as the conversation's title.
2. When the **first** message is sent in an unnamed topic, the sidebar invokes `onRequestTopicName(topic, firstMessageBody)` — once. It is not invoked again for later messages, and never for a topic that already has a name.
3. The host produces a name however it likes and supplies it **through the topic data**. When the updated topic arrives (the next query push, the next render), the placeholder simply stops being needed.

```tsx
<ChatSidebar
    ...
    onRequestTopicName={async (topic, firstMessage) => {
        const name = await askLlmForTopicName(firstMessage);   // your model, your prompt
        await renameTopic(topic.id, name);                     // your command — flows back in via the data
    }}
/>
```

## When "unnamed" means something else

The default rule is "no name, or only whitespace". A backend that stores a literal placeholder for unnamed topics overrides the rule — and the placeholder label — without touching anything else:

```tsx
<ChatSidebar
    ...
    isTopicUnnamed={topic => topic.name === 'New topic'}
    labels={{ unnamedTopic: 'Naming…' }}
/>
```

## Owning the selection

Left alone, the sidebar keeps the open topic internally and reports changes through `onTopicSelected(topicId, topic)` — `undefined` when the person goes back to the list. To own the selection (deep links, restoring state), pass `selectedTopicId`: an identifier opens that topic, `null` shows the list.
