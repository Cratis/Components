# Mentions and emoji

The composer offers `@`-mentions of people and agents and an emoji picker. This page covers where mention candidates come from, how mentions travel with a message, and how they render.

## Where candidates come from

Typing `@` opens the candidate list. Feed it one of two ways — or both:

```tsx
// A list the application already holds:
<ChatSidebar ... mentionCandidates={[
    { id: 'person-1', name: 'Sample User', hasAvatar: true, kind: ChatAuthorKind.User },
    { id: 'agent-1', name: 'Review Agent', hasAvatar: false, kind: ChatAuthorKind.Agent },
]} />

// A provider resolved as the person types — sync or async; stale answers are dropped:
<ChatSidebar ... resolveMentionCandidates={async query => await searchTeam(query)} />
```

People and agents are offered side by side — a candidate's `kind` (`ChatAuthorKind.User` | `ChatAuthorKind.Agent`) decides its avatar and how the mention is marked when rendered. Omit both props to turn mentions off.

## How mentions travel

The body stays plain readable text — a mention is written into it as `@Name`. Alongside the text, the send callback reports _who_ the body actually mentions:

```tsx
onSendMessage={(topicId, body, mentions) => {
    // body:     'over to you @Review Agent'
    // mentions: [{ id: 'agent-1', name: 'Review Agent', kind: ChatAuthorKind.Agent }]
}}
```

Mentions are extracted from the final text, so a mention that was picked but edited away again does not count. Store them with the message and hand them back on `ChatMessage.mentions` — that is what makes them render distinctly without re-parsing.

## How mentions render

Each known mention in a body renders as its own element, marked with the kind of team member it addresses:

```html
<span class="cratis-chat-message__mention" data-kind="agent">@Review Agent</span>
```

Both kinds are highlighted with the theme's primary color; agents additionally carry a dotted underline. Style them further — or differently per kind — through those hooks in your own CSS.

The parsing helpers are exported for hosts that need them elsewhere (notifications, backend-side checks in TypeScript): `findMentionRanges`, `extractMentions`, and `mentionSegments`, each generic over anything with a `name`.

## Emoji

The composer's emoji button opens a quick row of recently used emoji (kept per browser) that expands into the full categorized picker; the chosen emoji is inserted at the caret. Nothing to wire up — it comes with the composer.
