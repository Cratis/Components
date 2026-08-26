# Chat Bubble

The `ChatBubble` kit is a full commenting/chat system — a message thread, a composer with `@`-mentions and emoji, quick reactions, a typing indicator, and a failed-turn affordance. It is a much larger surface than the name "ChatBubble" suggests: `ChatBubble` itself is only the floating avatar "chat head" that opens a conversation; the conversation panel itself is the `Chat` component.

Like `Note` and `Region`, none of these components live inside a `CanvasItem` by requirement — `Chat` is a normal floating/docked panel, most often placed inside a `CanvasItem` so it can sit next to whatever it is commenting on, or rendered outside the `Canvas` entirely for a docked sidebar.

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

`messages`, `onSend`, and `onClose` are the only required props — everything else is opt-in, and each opt-in feature is gated on its own prop rather than a single "mode" switch:

| Feature                                                               | Enabled by                                                       |
| --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Reactions                                                             | `currentUserId` **and** `onReact` both given                     |
| Quick reply (prefills the composer with `@name`, followed by a space) | Always available once there is more than one author              |
| "Turn into an action" button                                          | `onAct` given (optionally filtered per-message by `canAct`)      |
| `@`-mentions in the composer                                          | `mentionCandidates` given                                        |
| Typing indicator                                                      | `typingAuthors` given (a list of who's currently typing/working) |
| Avatar images (instead of initials)                                   | `buildAvatarUrl` given                                           |
| "Report a bug" link on a failed turn                                  | `buildReportUrl` given                                           |

`variant` (`ChatVariant.Floating`, the default, or `ChatVariant.Docked`) controls whether `Chat` renders its own header/close button (`Floating`) or leaves the frame and heading to whatever contains it (`Docked`, for a sidebar that already has its own).

## Opt-in messaging — `id`

`Chat` accepts an optional `id`. When given, every send additionally publishes a `ChatMessageAdded` (carrying `chatId` and `text`) over the `@cratis/arc.react` messenger, at the same moment `onSend` fires — `onSend` remains the primary contract either way. Omit `id` for exactly the previous behavior: nothing published. See [Messaging](messaging.md) for the full catalog, the opt-in rules, and why this is silently inert without Arc.

## Avatars — `buildAvatarUrl`

No component in this kit stores or fetches avatar images itself. Every place an avatar appears (`Chat`, `ChatBubble`, `ChatComposer`'s mention list, the typing indicator) accepts an optional `buildAvatarUrl` callback:

```tsx
buildAvatarUrl={({ userId, ownerType, avatarSize, version }) =>
    `/api/avatars/${ownerType}/${userId}?size=${avatarSize}&v=${version ?? 0}`}
```

Omit it and every avatar falls back to the person's initials on a color deterministically derived from their identifier — the same person always gets the same fallback color, with no image request ever attempted.

## Reactions

Reactions are quick emoji given to a message (`ChatMessage.reactions: ChatMessageReaction[]`, each grouping the users who gave that emoji). The reaction button opens a `ReactionPicker`: a row of recently-used emoji (remembered per-browser in `localStorage` by default, or wherever a `memory: EmojiMemory` you pass points instead) plus a button that opens the full `EmojiPicker`. Picking the emoji already given is how a reaction is taken back — `onReact` is called either way and the caller decides give/change/revoke from what was clicked.

Applications that own those give/change/revoke commands can import `findOwnReaction(reactions, currentUserId)` from `@cratis/components/Canvas`. It returns the current person's `reactionId` and emoji, or `undefined`, so application command logic can follow the same one-reaction-per-person rule as the built-in chat composition.

## Mentions

Passing `mentionCandidates` (people and agents who can be `@`-mentioned) turns on mention suggestions in the composer: typing `@` opens a filtered `MentionSuggestions` list, navigable with the arrow keys and committed with `Enter`/`Tab`.

## Typing indicator

`typingAuthors: ChatTypingAuthor[]` renders the classic jumping-dots row with the given authors' avatars, composing an "X is typing" / "X and Y are typing" / "Several people are typing" label automatically. A person typing and an agent working on its answer are represented the same way on purpose.

## Failed turns

A message whose `failureDetail` is set (the turn ended in failure rather than an answer) never renders as a normal bubble — `Chat` renders a `FailedReply` line for it instead, saying plainly that the answer never came. It offers a "See error" link that opens the raw failure detail in a dialog, and — only when `buildReportUrl` is supplied — a "Report a bug" link built from the failure's details. There is no built-in retry action; re-sending is left to whatever a host's own composer/send flow already does.
