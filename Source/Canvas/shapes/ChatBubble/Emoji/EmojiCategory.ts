// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { EmojiCategoryKey } from './EmojiCategoryKey';

/** One section of the full emoji picker. */
export interface EmojiCategory {

    /** Which section this is. */
    key: EmojiCategoryKey;

    /** The emojis it offers, in the order they are shown. */
    emojis: readonly string[];
}
