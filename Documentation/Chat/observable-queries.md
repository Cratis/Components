# Observable queries

`ChatSidebar` is deliberately query-agnostic — arrays in, callbacks out. For applications on Cratis Arc, `ChatSidebarForObservableQueries` binds it to two real-time observable queries so both the topics and the open topic's messages stay current as the read models change server-side.

## Usage

```tsx
import { ChatSidebarForObservableQueries } from '@cratis/components/Chat';
import { AllTopics, MessagesForTopic } from './queries'; // generated observable query proxies

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
/>;
```

- `topicsQuery` subscribes immediately (pass `topicsArguments` when the query takes any).
- `messagesQuery` subscribes only while a topic is open. `messagesArguments` derives the query arguments from the open topic's id; answering `undefined` holds the subscription.
- The wrapper owns the topic selection so it can re-target the messages subscription; everything else — every callback, every render hook — is the same contract as [`ChatSidebar`](./index.md).

## When not to use it

If the application already manages its own subscriptions (a shared cache, a view model layer, data arriving over something other than Arc queries), use `ChatSidebar` directly and hand it the arrays — the wrapper adds nothing but the two `useObservableQuery` calls.
