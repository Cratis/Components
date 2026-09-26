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
- The wrapper passes each query's data and display status to the sidebar. With no topics or messages, a pending query shows a loading announcement; a failed, invalid, or unauthorized query shows an alert rather than the empty-state text. It never displays server exception details.

## Loading and failed queries

The topics and messages queries resolve their statuses independently. Authorization denial takes precedence over failure or validation errors; failure takes precedence over loading. When a query is performing with no data, its list or conversation shows a loading message. When it completes successfully with an empty result, the ordinary empty-state text returns. Existing topics and messages stay visible during a refetch. After a failure, a failure alert appears above the existing topics or messages, which remain visible. An unauthorized result replaces previously loaded content with an access-denied alert.

Set `labels.topicList.loading`, `labels.topicList.failed`, and `labels.topicList.unauthorized` for the topic list; set the corresponding `labels.conversation` keys for messages. The English defaults are “Loading topics…”, “Could not load topics.”, and “You are not authorized to view these topics.” for the list, and “Loading messages…”, “Could not load messages.”, and “You are not authorized to view these messages.” for the conversation. Chat uses `labels`, not the provider's `messages.dataTable` settings.

If you own the queries yourself, use [`ChatSidebar`](./index.md#query-display-states) with `topicsStatus` and `messagesStatus` instead of this wrapper.

## When not to use it

If the application already manages its own subscriptions (a shared cache, a view model layer, data arriving over something other than Arc queries), use `ChatSidebar` directly and hand it the arrays — the wrapper adds nothing but the two `useObservableQuery` calls.

Use `ChatSidebar` directly as well when you need to own the selection (deep links, restoring the open topic), map read models whose shape differs from `ChatTopic` and `ChatMessage`, or render query states differently from the built-in status messages. Call `useObservableQuery` (or the proxies' `use()` methods) yourself and pass the data, optional statuses, and any custom UI.
