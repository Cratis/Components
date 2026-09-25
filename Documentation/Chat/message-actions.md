---
title: Message actions
description: Offer your own actions on chat messages and control the built-in quick reply.
---

The library ships no actions of its own — whatever a message can be turned into (a task, an issue, a document, a link somewhere) is the application's business, expressed as action descriptors on the conversation.

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

Actions appear as a small button row over a message's corner while it is hovered (or while one of the buttons holds keyboard focus). The buttons are hidden with opacity rather than removed, so they stay in the Tab order: a keyboard user reaches them with Tab, and the row appears as soon as one of them has focus. `label` is each button's tooltip and accessible name. `onInvoke` receives the full message — with the components generic over your extended message type, everything your action needs rides along on the message itself.

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

What happens on invoke — a dialog with a repository picker, a navigation, a command — is entirely yours; the conversation only raised the intent with the message attached.

## Quick reply

One conversational affordance is built in: quick reply, which prefills the composer with `@Name` for the message's author. It is chat behavior rather than a host action, on by default, and switched off with `quickReply={false}`.
