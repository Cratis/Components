# Canvas

The `Canvas` module provides a pan/zoom/drag surface for building spatial, freely-positioned UIs — boards, editors, diagrams, or anything laid out in an infinite 2D plane rather than the normal document flow. On top of the surface engine itself, it ships a set of ready-made presentational shapes — sticky notes, labeled regions, and a full chat/comment kit — for building the kind of "sticky notes and regions" board these were originally extracted from.

The engine (`Canvas`, `CanvasItem`, `CanvasControls`, `CanvasMinimap`) is independent of the shapes: it renders and positions whatever you give it, and knows nothing about notes, regions, or chat. The shapes (`Note`, `Region`, the `ChatBubble` kit) are ordinary presentational components that happen to be designed to live inside a `Canvas`.

## Components

| Component | Description |
|---|---|
| `Canvas` | The pan/zoom/drag surface itself — the container every other piece renders inside of |
| `CanvasItem` | Positions a single piece of content at world-space `x`/`y` coordinates inside a `Canvas` |
| `CanvasControls` | The zoom in/out/reset pill and optional minimap toggle rendered over a `Canvas` |
| `CanvasMinimap` | A small overview panel showing item positions and the current viewport, with click/drag-to-pan |
| `CanvasOverlay` | Portals its children to `document.body`, for board overlays that must escape the canvas's own clipping/stacking context |
| `CanvasHandle` | The imperative handle type exposed via `onHandleReady`, for programmatic pan/zoom and bounds queries |
| `Note` | A draggable, resizable, editable sticky note with auto-fitting text |
| `Region` | A draggable, resizable, labeled box other shapes can be visually nested inside of |
| `Chat` | The chat/comment thread panel: message list, composer, reactions, mentions, typing indicator |
| `ChatBubble` | A floating avatar "chat head" with a hover preview of the latest message — the entry point into a conversation, not the conversation itself |
| `ChatComposer` | The compose row: text input, `@`-mention suggestions, emoji insert, send button |
| `ChatMessageBubble` | One rendered message, with its optional reaction and quick-reply/act affordances |
| `FailedReply` | The line a message renders in place of an answer when its turn failed, with "see error" and an optional "report a bug" link |
| `MessageReactions` | The row of emoji badges under a message, one stacked badge per distinct emoji |
| `ReactionPicker` | The quick-emoji popover opened from a reaction button or the composer's emoji toggle |
| `TypingIndicator` | The "X is typing" line with jumping dots, shown while somebody is composing or an agent is working |
| `PersonAvatarCircle` | A person/agent avatar circle, falling back to initials on a deterministic color when no image is available |
| `EmojiPicker` | The full emoji picker `ReactionPicker` opens when its quick row isn't enough |
| `MentionSuggestions` | The `@`-mention candidate list `ChatComposer` opens while typing a mention |

A handful of supporting types travel with these components: `NoteData` and `RegionData` (the controlled data shapes for `Note`/`Region`), `ChatMessage`, `ChatAuthorKind`, `ChatVariant`, `MentionCandidate`, `ChatTypingAuthor`, `ChatMessageReaction`, and `BuildAvatarUrlParams` (the parameters passed to a `buildAvatarUrl` callback). These are covered alongside the component that uses them in the pages below rather than getting a row of their own.
