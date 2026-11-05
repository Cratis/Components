---
title: Canvas chat — add a conversation to a board
description: Add a conversation panel or avatar chat head to a Canvas board, with application-owned messages, reactions, and persistence.
---

Use `Chat` from Cratis Components to place a conversation beside an item on a Canvas board. It displays the messages you supply and calls `onSend` when someone submits text. Your application updates the thread and saves it. `ChatBubble` is a separate avatar marker for representing a conversation on the board.

Wrap a panel in `CanvasItem` when it should pan and zoom with the item it discusses. Render it outside Canvas for a sidebar that stays in place. Neither `Chat` nor `ChatBubble` requires a `CanvasItem`; your layout decides where each appears.

The examples below use the lower-level chat kit exported by `@cratis/components/Canvas`. For a higher-level conversation or sidebar outside a spatial board, see the [Chat conversation components](../Chat/index.md).

:::caution[Importing the kit from Canvas needs pixi.js]
`Chat`, `ChatBubble`, `ChatComposer`, and the other kit primitives are exported only from `@cratis/components/Canvas`. That subpath's module imports `pixi.js` when it loads, so the optional `pixi.js` peer must be installed even when you use only the chat kit. If you want a chat without Pixi, use `ChatConversation` or `ChatSidebar` from `@cratis/components/Chat` instead.
:::

## Place a `ChatBubble` on the board

Use `ChatBubble` for a compact avatar marker, with `authorId`, `authorName`, and `hasAvatar`. Wrap it in a `CanvasItem` to position it. Supply `previewMessage`, `previewTimestamp`, and `replyCount` for its hover summary; `selected` and `showThinkingBubbles` reflect your application's selection and work state.

The marker does not open a panel itself. Handle activation in your own surrounding control and render the corresponding `Chat` panel when selected. Use `suppressPreview` if the hover summary would compete with an open conversation.

## `Chat` — the conversation panel

```tsx
import { useState } from 'react';
import { Guid } from '@cratis/fundamentals';
import { Chat, ChatAuthorKind, type ChatMessage } from '@cratis/components/Canvas';

const me = Guid.create();

function Conversation() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: Guid.create(),
            authorId: Guid.create(),
            authorName: 'Sample User',
            authorInitials: 'SU',
            hasAvatar: false,
            authorKind: ChatAuthorKind.User,
            text: 'This is a sample message.',
            timestamp: new Date(),
        },
    ]);

    const send = (text: string) => {
        setMessages((current) => [
            ...current,
            {
                id: Guid.create(),
                authorId: me,
                authorName: 'You',
                authorInitials: 'Y',
                hasAvatar: false,
                authorKind: ChatAuthorKind.User,
                text,
                timestamp: new Date(),
            },
        ]);
    };

    return (
        <Chat
            messages={messages}
            onSend={send}
            onClose={() => {}}
            currentUserId={me}
            onReact={(messageId, emoji) =>
                console.log('react', messageId.toString(), emoji)
            }
        />
    );
}
```

Render `Conversation` and send a message to append it to the local thread. The `send` callback owns that update; Chat does not append messages itself. This example keeps messages only in React state and logs reaction requests, so neither survives a reload. In your application, connect those callbacks to your persistence flow and pass the updated messages back into Chat.

While `messages` is empty, the panel shows "No comments yet. Be the first!"; override it with `labels.noComments`. Show loading and thread-loading errors around the panel. To represent an individual turn that failed, supply a message with `failureDetail` (see [Failed turns](#failed-turns)).

`messages`, `onSend`, and `onClose` are required. Enable other interactions only when your application can handle them:

| Feature                                                               | Enabled by                                                       |
| --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Reactions                                                             | `currentUserId` **and** `onReact` both given                     |
| Quick reply (prefills the composer with `@name`, followed by a space) | Always on: every message bubble has a reply button               |
| "Turn into an action" button                                          | `onAct` given (optionally filtered per-message by `canAct`)      |
| `@`-mentions in the composer                                          | `mentionCandidates` or `resolveMentionCandidates` given          |
| Typing indicator                                                      | `typingAuthors` given (a list of who's currently typing/working) |
| Avatar images (instead of initials)                                   | `buildAvatarUrl` given                                           |
| "Report a bug" link on a failed turn                                  | `buildReportUrl` given                                           |

`variant` (`ChatVariant.Floating`, the default, or `ChatVariant.Docked`) controls whether `Chat` renders its own header/close button (`Floating`) or leaves the frame and heading to whatever contains it (`Docked`, for a sidebar that already has its own).

## Opt-in messaging — `id`

Give `Chat` an `id` when other components need to observe sends. After calling `onSend`, Chat publishes a local `ChatMessageAdded` with `chatId` and `text` through the `@cratis/arc.react` messenger. Omitting `id` disables this announcement; it does not change the callback. The message reports a send, not a successful save. See [Messaging](messaging.md) to subscribe on the same messenger.

## Avatars — `buildAvatarUrl`

Supply `buildAvatarUrl` to tell the kit where your application serves avatar images. Chat messages, `ChatBubble`, mention suggestions, and the typing indicator use this callback to build image URLs:

```tsx
buildAvatarUrl={({ userId, ownerType, avatarSize, version }) =>
    `/api/avatars/${ownerType}/${userId}?size=${avatarSize}&v=${version ?? 0}`}
```

Without the callback, avatars use initials and a color derived from the person's identifier, with no image request. The same identifier produces the same fallback color.

## Reactions

Each message's `ChatMessage.reactions: ChatMessageReaction[]` groups reactions by emoji and records who gave them. The reaction button opens a `ReactionPicker` with recently used emoji and a button for the full `EmojiPicker`. Recent choices use browser `localStorage` by default; a standalone picker accepts `memory: EmojiMemory` for another storage location.

`onReact` reports every selection, including the person's existing emoji when they want to withdraw it. Your application decides whether to give, change, or revoke the reaction, then supplies the updated message. Remembering recently used emoji does not persist reactions on messages.

Applications that own those give/change/revoke commands can import `findOwnReaction(reactions, currentUserId)` from `@cratis/components/Canvas`. It returns the current person's `reactionId` and emoji, or `undefined`, so application command logic can follow the same one-reaction-per-person rule as the built-in chat composition.

## Mentions

Pass `mentionCandidates` for a known list of people and agents, or `resolveMentionCandidates` to look them up as someone types. Typing `@` opens filtered suggestions; arrow keys move through the list and `Enter`/`Tab` selects a candidate.

## Typing indicator

Supply `typingAuthors: ChatTypingAuthor[]` from your application's presence or agent-work state. Chat renders their avatars with animated dots and an "X is typing" / "X and Y are typing" / "Several people are typing" label. The prop controls the display; Chat does not detect another user's activity itself.

## Failed turns

Set `failureDetail` when a turn ends without an answer. Chat renders a `FailedReply` line instead of a message bubble, with a "See error" link that opens the raw detail in a dialog. Supplying `buildReportUrl` also adds a "Report a bug" link. Your application owns any retry or re-send flow; Chat supplies no retry action.

To connect board conversations to other interactions, continue to [Canvas messaging](messaging.md). Use the [Canvas API reference](index.md#included-shapes) to look up the kit's other components.
