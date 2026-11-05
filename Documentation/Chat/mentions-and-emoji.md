---
title: "Chat mentions and emoji: compose messages"
description: Add people and agent mentions to the Chat composer from your own candidates, store mention identities with messages, and insert emoji at the caret.
---

The Cratis Components Chat composer lets people mention a person or agent with `@` and insert emoji at the caret. Your application supplies the people and agents who can be mentioned, then stores their identities alongside the message text so the conversation can highlight them.

## Where candidates come from

Supply `mentionCandidates` when your application already has a list of people and agents, or `resolveMentionCandidates` to look them up as someone types after `@`. You can use both; the composer combines the results by id and shows matching candidates.

In the excerpts below, `sidebarProps` stands for the required `ChatSidebar` props (`open`, `onClose`, `topics`, `messages`, `onSendMessage`) shown in the [basic usage](./index.md#basic-usage). `searchTeam` stands for your own lookup.

```tsx
// A list the application already holds:
<ChatSidebar {...sidebarProps} mentionCandidates={[
    { id: 'person-1', name: 'Sample User', hasAvatar: true, kind: ChatAuthorKind.User },
    { id: 'agent-1', name: 'Review Agent', hasAvatar: false, kind: ChatAuthorKind.Agent },
]} />

// A provider resolved as the person types — sync or async; stale answers are dropped:
<ChatSidebar {...sidebarProps} resolveMentionCandidates={async query => await searchTeam(query)} />
```

A `MentionCandidate` has a string `id`, `name`, `hasAvatar`, `kind`, and an optional `avatarVersion`. People and agents appear in the same list. Their `kind` (`ChatAuthorKind.User` | `ChatAuthorKind.Agent`) distinguishes people from agents for avatar lookup and mention styling. Omit both candidate props to disable mention suggestions.

The composer discards asynchronous lookup results after the search text changes. If a lookup promise rejects, it clears the resolved candidates; any candidates supplied through `mentionCandidates` remain available.

## Keyboard use

While mention suggestions are open, use the Up and Down arrow keys to move the highlight and Enter or Tab to choose the highlighted candidate. With the suggestions closed, Enter sends the message unless Shift is held.

Focus stays in the message box while the suggestions are open. The arrow keys move the highlight, and the box points at the highlighted option with `aria-activedescendant`. Enter or Tab picks it. Escape closes the suggestions without touching the draft or the caret, and without reaching a dialog around the composer; editing the text after the `@` opens them again. With the suggestions closed, Enter sends the draft as written.

## How mentions travel

The body remains plain text, with each mention written as `@Name`. The send callback also reports the identities of known candidates mentioned in that text:

```tsx
onSendMessage={(topicId, body, mentions) => {
    // body:     'over to you @Review Agent'
    // mentions: [{ id: 'agent-1', name: 'Review Agent', kind: ChatAuthorKind.Agent }]
}}
```

Mentions are extracted from the final text, so a mention that was picked but edited away does not count. Store the reported mentions with the message and return them on `ChatMessage.mentions`. The conversation uses those identities to highlight mentions without looking up candidates again.

## How mentions render

Each known mention in a body renders as its own element, marked with the kind of team member it addresses:

```html
<span class="cratis-chat-message__mention" data-kind="agent">@Review Agent</span>
```

Both kinds use the theme's highlight text and background colors; agents also have a dotted underline. Use the class and `data-kind` attribute to adjust their appearance in your CSS.

If your application needs to process mentions outside the conversation, `findMentionRanges`, `extractMentions`, and `mentionSegments` are exported helpers. Each accepts candidates with a `name` property.

## Emoji

The composer's emoji button opens a quick row of recently used emoji, with an option to open the full categorized picker. Choosing an emoji inserts it at the caret. Recent choices are stored in the browser when storage is available; no application callback is required.

To let someone reply directly to a message's author, see [quick reply](./message-actions.md#quick-reply).
