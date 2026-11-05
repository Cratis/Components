---
title: "Chat topic actions: act without opening a conversation"
description: Add application-owned actions beside Chat topics so people can rename or archive a conversation without opening it or changing topic selection.
---

Cratis Components Chat topic actions let someone rename, archive, or otherwise act on a conversation from the topic list without opening it. Pass `topicActions` to `ChatSidebar` or the standalone `ChatTopicList`; your application supplies the operation and handles the selected topic.

Use `topicActions` for a whole topic and the sidebar's `actions` prop for individual [messages](./message-actions.md). Neither prop supplies business operations on its own.

## Descriptor

| Field | Type | Required | Behavior |
| --- | --- | --- | --- |
| `id` | `string` | Yes | Unique rendering key among the actions. |
| `label` | `string` | Yes | Tooltip text; the accessible name also includes the topic's name. Shown as button text if no icon is supplied. |
| `icon` | `string \| ReactNode` | No | An icon-font CSS class name or a ready element. |
| `isAvailable` | `(topic: TTopic) => boolean` | No | Return `false` to omit the action for a topic; omitted means available on every topic. |
| `onInvoke` | `(topic: TTopic) => void` | Yes | Receives the full host topic when the control is activated. |

Action buttons sit beside the button that opens the conversation. They appear on hover or keyboard focus, and Tab reaches each available control. Activating an action calls its handler without opening the topic; any navigation in the handler remains your application's choice.

## Offer an action

This excerpt assumes `sidebarProps` supplies `open`, `onClose`, `topics`, `messages`, and `onSendMessage` as in [basic usage](./index.md#basic-usage). The handlers belong to your application.

```tsx
import { ChatSidebar } from '@cratis/components/Chat';

<ChatSidebar
    {...sidebarProps}
    topicActions={[
        {
            id: 'rename',
            label: 'Rename',
            icon: 'my-icon-font-edit',
            isAvailable: topic => Boolean(topic.name?.trim()),
            onInvoke: topic => renameTopic(topic.id),
        },
    ]}
/>
```

The same `topicActions` prop works on `ChatTopicList`. Omit it when topics need only their opening button.

After a handler changes a topic, supply the updated topic data so the list reflects the result. For example, the rename handler must store the new name and return it in `topics`; the action button does not change `topic.name` itself. See [topics and naming](./topics-and-naming.md) for how names and unnamed placeholders are displayed.
