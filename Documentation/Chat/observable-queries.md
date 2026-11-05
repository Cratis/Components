---
title: "Chat observable queries: keep topics and messages current"
description: Bind ChatSidebar to Cratis Arc observable queries for live topics and messages, with loading, failure, and access-denied states handled separately.
---

`ChatSidebarForObservableQueries` connects Cratis Components Chat to two Cratis Arc observable queries: subscriptions that receive updated query results as server-side data changes. Use it when your application already exposes topics and messages through Arc and you want the sidebar to manage those subscriptions and display their loading or failure states.

The wrapper is optional. `ChatSidebar` accepts arrays and callbacks directly when your application uses another data source or manages subscriptions itself.

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

`topicsQuery` subscribes when the component mounts, even when `open` is `false`. Pass `topicsArguments` if the query takes arguments, and mount the wrapper only where that subscription should be live. Closing the sidebar does not unmount the wrapper or stop its subscriptions.

`messagesQuery` subscribes while a topic is selected and `messagesArguments` returns arguments for it. Return `undefined` to hold the subscription. The wrapper owns topic selection so it can switch the messages query to the selected topic. It does not accept `selectedTopicId`; use `onTopicSelected` to observe selection changes.

Sending, topic creation, naming, actions, and render callbacks use the same contract as [`ChatSidebar`](./index.md). The queries supply data, not write operations: your application still handles each callback and updates the server-side data.

## Loading and failed queries

Topics and messages have independent display states. Access denial takes precedence over other flags. Exceptions or validation errors produce a failure state before loading is considered. Otherwise, a performing query or a result marked not ready shows loading; a settled unsuccessful result shows failure. The sidebar displays these states without server exception details.

With no data, a loading query shows a status announcement, while failure or access denial shows an alert. A successful empty result shows the ordinary empty-state text, so an empty conversation is not confused with a query that could not load.

During a refetch with the same arguments, topics or messages remain visible only if the latest result still contains them. After a failure, the alert appears above that data. If the failed result omits data, the wrapper does not retain the last successful collection.

Changing `topicsArguments` or selecting another topic shows loading without the previous query's data or status until a result for the new arguments arrives. Returning to earlier arguments can restore a cached result. An unauthorized result hides the affected content: topic access denial disables starting a topic, and message access denial disables the composer.

Set `labels.topicList.loading`, `labels.topicList.failed`, and `labels.topicList.unauthorized` to replace the topic-list messages. Use the same keys under `labels.conversation` for messages. The English defaults are “Loading topics…”, “Could not load topics.”, and “You are not authorized to view these topics.” for the list, and “Loading messages…”, “Could not load messages.”, and “You are not authorized to view these messages.” for the conversation. Chat uses `labels`, not the provider's `messages.dataTable` settings.

If you own the queries yourself, use [`ChatSidebar`](./index.md#query-display-states) with `topicsStatus` and `messagesStatus` instead of this wrapper.

## When not to use it

Use `ChatSidebar` directly if your application already manages subscriptions or receives data from another source. It is also the better fit when you need controlled selection for deep links, must map query results to `ChatTopic` and `ChatMessage`, or want custom query-state UI.

For Arc queries, call `useObservableQuery` or the proxies' `use()` methods yourself. Pass the resulting arrays and optional statuses to [`ChatSidebar`](./index.md#query-display-states), and keep selection or custom state handling in your application.
