// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export { Chat } from './Chat';
export type { ChatProps, ChatLabels } from './Chat';
export { ChatAuthorKind } from './ChatAuthorKind';
export { ChatBubble } from './ChatBubble';
export type { ChatBubbleProps } from './ChatBubble';
export { ChatComposer } from './ChatComposer';
export type {
    ChatComposerProps,
    ChatComposerHandle,
    ChatComposerLabels,
} from './ChatComposer';
export type { ChatMessage } from './ChatMessage';
export { ChatMessageBubble } from './ChatMessageBubble';
export type {
    ChatMessageBubbleProps,
    ChatMessageBubbleLabels,
} from './ChatMessageBubble';
export type { ChatMessageReaction } from './ChatMessageReaction';
export type { ChatMessageReactionUser } from './ChatMessageReactionUser';
export type { ChatOwnReaction } from './ChatOwnReaction';
export type { ChatTypingAuthor } from './ChatTypingAuthor';
export { ChatVariant } from './ChatVariant';
export { FailedReply } from './FailedReply';
export type {
    FailedReplyProps,
    FailedReplyLabels,
    FailedReplyReportDetails,
} from './FailedReply';
// A consumer that owns reaction commands can use the same current-user lookup as the
// Components chat composition without duplicating its one-reaction-per-person rules.
export { findOwnReaction } from './findOwnReaction';
// `reactionsExcludingUser` remains an internal rendering helper.
export { MessageReactions } from './MessageReactions';
export type { MessageReactionsProps } from './MessageReactions';
export { ReactionPicker } from './ReactionPicker';
export type { ReactionPickerProps, ReactionPickerLabels } from './ReactionPicker';
export { TypingIndicator } from './TypingIndicator';
export type { TypingIndicatorProps } from './TypingIndicator';
export { AnchoredOverlay } from './AnchoredOverlay';
export type {
    AnchoredOverlayProps,
    AnchoredOverlaySide,
    AnchoredOverlayAlign,
} from './AnchoredOverlay';

export * from './Avatar';
export * from './Emoji';
export * from './Mentions';
