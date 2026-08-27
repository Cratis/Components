// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export type { ChatAuthor } from './ChatAuthor';
export { ChatConversation } from './ChatConversation';
export type { ChatConversationProps, ChatConversationLabels } from './ChatConversation';
export { chatIdentifierString, sameChatIdentifier } from './ChatIdentifier';
export type { ChatIdentifier } from './ChatIdentifier';
export type { ChatMention } from './ChatMention';
export type { ChatMessage } from './ChatMessage';
export type { ChatMessageAction } from './ChatMessageAction';
export { ChatMessageBody } from './ChatMessageBody';
export type { ChatMessageBodyProps } from './ChatMessageBody';
export { ChatSidebar } from './ChatSidebar';
export type {
    ChatSidebarProps,
    ChatSidebarLabels,
    ChatSidebarParts,
} from './ChatSidebar';
export { ChatSidebarForObservableQueries } from './ChatSidebarForObservableQueries';
export type { ChatSidebarForObservableQueriesProps } from './ChatSidebarForObservableQueries';
export type { ChatTopic } from './ChatTopic';
export { ChatTopicList } from './ChatTopicList';
export type { ChatTopicListProps, ChatTopicListLabels } from './ChatTopicList';
export { isTopicUnnamed } from './isTopicUnnamed';
export { relativeTimestamp } from './relativeTimestamp';
export type { RelativeTimestampLabels } from './relativeTimestamp';
export { shouldRequestTopicName } from './shouldRequestTopicName';
export { topicsByActivity } from './topicsByActivity';

// The pieces of the conversation kit the chat builds on, re-exported so a host consuming
// `@cratis/components/Chat` has the whole contract in one place.
export { ChatAuthorKind } from '../Canvas/shapes/ChatBubble/ChatAuthorKind';
export type { ChatTypingAuthor } from '../Canvas/shapes/ChatBubble/ChatTypingAuthor';
export type { BuildAvatarUrlParams } from '../Canvas/shapes/ChatBubble/Avatar';
export type { ChatComposerLabels } from '../Canvas/shapes/ChatBubble/ChatComposer';
export {
    extractMentions,
    findMentionRanges,
    mentionSegments,
} from '../Canvas/shapes/ChatBubble/Mentions';
export type {
    MentionCandidate,
    MentionRange,
    MentionSegment,
} from '../Canvas/shapes/ChatBubble/Mentions';
