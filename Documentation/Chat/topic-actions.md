---
title: Topic actions
description: Offer host-owned actions next to each topic without opening its conversation.
---

Pass `topicActions` to `ChatSidebar` or the standalone `ChatTopicList` when a person needs to rename, archive, or otherwise act on a topic without opening it. Unlike the sidebar's `actions` prop, which applies to **messages**, `topicActions` applies to topics only.

## Descriptor

| Field | Type | Required | Behavior |
| --- | --- | --- | --- |
| `id` | `string` | Yes | Unique rendering key among the actions. |
| `label` | `string` | Yes | Tooltip and accessible name (combined with the topic's name). Shown as button text if no icon is supplied. |
| `icon` | `string \| ReactNode` | No | An icon-font CSS class name or a ready element. |
| `isAvailable` | `(topic: TTopic) => boolean` | No | Return `false` to omit the action for a topic; omitted means available on every topic. |
| `onInvoke` | `(topic: TTopic) => void` | Yes | Receives the full host topic when the control is activated. |

The buttons sit beside, not inside, the button that opens the conversation. They appear on hover or keyboard focus. Tab reaches each available control, and activating one does not open the topic.

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

The same `topicActions` prop works on `ChatTopicList`. Omit it to leave the existing topic markup and opening behavior unchanged.
