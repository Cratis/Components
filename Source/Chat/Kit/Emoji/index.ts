// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export * from './EmojiCategory';
// `EmojiCategoryKey` and `EMOJI_CATALOG` are internal implementation details of
// `EmojiPicker` and are intentionally not part of the public API.
export * from './EmojiMemory';
export * from './EmojiPicker';
export { recentEmojis, rememberEmoji } from './recentEmojis';
// `DEFAULT_EMOJIS` and `QUICK_ROW_SIZE` are internal constants used by
// `recentEmojis`/`rememberEmoji` and are intentionally not part of the public API.
