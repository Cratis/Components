# Message actions

The library ships no actions of its own — whatever a message can be turned into (a task, an issue, a document, a link somewhere) is the application's business, expressed as action descriptors on the conversation.

## The descriptor

```typescript
interface ChatMessageAction<TMessage extends ChatMessage = ChatMessage> {
    id: string; // rendering key among its siblings
    label: string; // tooltip and accessible name
    icon: string | ReactNode; // 'pi pi-bolt', or a ready element
    isAvailable?: (message: TMessage) => boolean; // omit to offer on every message
    onInvoke: (message: TMessage) => void;
}
```

Actions appear as a small button row over a message's corner while it is hovered (or while one of the buttons holds keyboard focus). `onInvoke` receives the full message — with the components generic over your extended message type, everything your action needs rides along on the message itself.

## Offering actions

```tsx
<ChatSidebar<ProjectMessage>
    ...
    actions={[
        {
            id: 'create-issue',
            label: 'Create an issue from this',
            icon: 'pi pi-plus-circle',
            onInvoke: message => openCreateIssueDialog(message),
        },
        {
            id: 'associate-issue',
            label: 'Associate with an issue',
            icon: 'pi pi-link',
            onInvoke: message => openAssociateIssueDialog(message),
        },
        {
            id: 'retry',
            label: 'Run this again',
            icon: 'pi pi-refresh',
            isAvailable: message => message.metadata?.failed === true,
            onInvoke: message => retry(message),
        },
    ]}
/>
```

What happens on invoke — a dialog with a repository picker, a navigation, a command — is entirely yours; the conversation only raised the intent with the message attached.

## Quick reply

One conversational affordance is built in: quick reply, which prefills the composer with `@Name` for the message's author. It is chat behavior rather than a host action, on by default, and switched off with `quickReply={false}`.
