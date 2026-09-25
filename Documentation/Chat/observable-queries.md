---
title: Observable queries
description: Bind ChatSidebar to two Cratis Arc observable queries for live topics and messages.
---

`ChatSidebar` is deliberately query-agnostic — arrays in, callbacks out. For applications on Cratis Arc, `ChatSidebarForObservableQueries` binds it to two real-time observable queries so both the topics and the open topic's messages stay current as the read models change server-side.

## Prerequisites

- `@cratis/arc` and `@cratis/arc.react` installed in the range Components declares as peers.
- The component rendered inside Arc's `<Arc>` provider from `@cratis/arc.react`, which supplies the origin, API base path, microservice, and shared query cache the subscriptions use. See [CratisComponentsProvider](../Common/cratis-components-provider.md#use-it-with-arc).
- Two generated observable query proxies: one returning topics that satisfy `ChatTopic`, and one taking the open topic's id and returning messages that satisfy `ChatMessage`. The read models' property names must match those interfaces (`id`, `name`, `lastActivity`, `topicId`, `authorId`, `body`, `timestamp`, and so on).

## Usage

```tsx
import { useState } from 'react';
import { ChatSidebarForObservableQueries } from '@cratis/components/Chat';
import { AllTopics, MessagesForTopic } from './queries'; // generated observable query proxies

export const LiveChat = () => {
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <ChatSidebarForObservableQueries
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            topicsQuery={AllTopics}
            messagesQuery={MessagesForTopic}
            messagesArguments={(topicId) => (topicId ? { topicId: String(topicId) } : undefined)}
            authorOf={authorOf}
            onStartTopic={startTopic}
            onSendMessage={send}
            onRequestTopicName={nameTopic}
            mentionCandidates={candidates}
        />
    );
};
```

`authorOf`, `startTopic`, `send`, `nameTopic`, and `candidates` are your own, as in the [basic usage](./index.md#basic-usage). Render a control that sets `chatOpen` to `true`.

- `topicsQuery` subscribes as soon as the component mounts, whether or not `open` is `true` (pass `topicsArguments` when the query takes any). Mount the wrapper only where the subscription should be live.
- `messagesQuery` subscribes only while a topic is open. `messagesArguments` derives the query arguments from the open topic's id; answering `undefined` holds the subscription.
- The wrapper owns the topic selection so it can re-target the messages subscription; everything else — every callback, every render hook — is the same contract as [`ChatSidebar`](./index.md). It does not accept `selectedTopicId`; observe changes through `onTopicSelected`.
- Only each query's `data` reaches the sidebar. While a query is loading or after it fails, the sidebar shows an empty topic list or an empty conversation. The wrapper surfaces no loading or error state.

## When not to use it

If the application already manages its own subscriptions (a shared cache, a view model layer, data arriving over something other than Arc queries), use `ChatSidebar` directly and hand it the arrays — the wrapper adds nothing but the two `useObservableQuery` calls.

Use `ChatSidebar` directly as well when you need to show a loading or failure state, to own the selection (deep links, restoring the open topic), or to map read models whose shape differs from `ChatTopic` and `ChatMessage`. Call `useObservableQuery` (or the proxies' `use()` methods) yourself and pass `result.data` along with your own status UI.
