---
title: "Chat message actions: connect messages to your workflow"
description: Add application-owned actions to Chat messages, control which messages offer them, and use quick reply to prefill a mention of the author.
---

Cratis Components Chat message actions let someone act on a message without leaving the conversation to find its context. Supply an action descriptor for each operation your application supports, such as creating an issue from a message. The chat renders the button and passes the message to your handler; your application performs the operation.

## The descriptor

```typescript
interface ChatMessageAction<TMessage extends ChatMessage = ChatMessage> {
    id: string; // rendering key among its siblings
    label: string; // tooltip and accessible name
    icon: string | ReactNode; // a ready element, or a CSS class name for an icon font you provide
    isAvailable?: (message: TMessage) => boolean; // omit to offer on every message
    onInvoke: (message: TMessage) => void;
}
```

Actions appear in a button row at a message's corner on hover or when an action has keyboard focus. The buttons remain in the Tab order while hidden, and the row becomes visible as soon as one receives focus. Each button uses `label` for its tooltip and accessible name.

`onInvoke` receives the full message, including fields you added to `ChatMessage`. Use `isAvailable` to offer an action only on relevant messages; omitting it makes the action available on every message.

## Offering actions

In the excerpts below, `sidebarProps` stands for the required `ChatSidebar` props (`open`, `onClose`, `topics`, `messages`, `onSendMessage`) shown in the [basic usage](./index.md#basic-usage).

```tsx
<ChatSidebar<ProjectMessage>
    {...sidebarProps}
    actions={[
        {
            id: 'create-issue',
            label: 'Create an issue from this',
            icon: <FaCirclePlus />,
            onInvoke: message => openCreateIssueDialog(message),
        },
        {
            id: 'associate-issue',
            label: 'Associate with an issue',
            icon: <FaLink />,
            onInvoke: message => openAssociateIssueDialog(message),
        },
        {
            id: 'retry',
            label: 'Run this again',
            icon: 'my-icon-font-refresh', // a class name works just as well
            isAvailable: message => message.metadata?.failed === true,
            onInvoke: message => retry(message),
        },
    ]}
/>
```

These handlers belong to your application. They can open a dialog, navigate to related work, or run a command. The conversation does not create issues or retry messages itself. When an operation changes a message, supply the updated message data to show that change.

## Quick reply

Quick reply is built in and enabled by default. It prefills the composer with `@Name` for the message's author so the person can write a reply; it does not send a message. Set `quickReply={false}` to remove that button without affecting your custom actions.

Use [mentions and emoji](./mentions-and-emoji.md) to supply mention candidates. For operations on a whole conversation rather than one message, use [topic actions](./topic-actions.md).
