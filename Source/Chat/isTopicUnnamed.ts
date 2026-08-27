// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChatTopic } from './ChatTopic';

/**
 * Whether a topic has not been named yet — no name, or only whitespace. Unnamed topics render a
 * placeholder until the host supplies the real name. Hosts whose backend stores a literal
 * placeholder for "unnamed" (rather than leaving the name blank) override this through the
 * `isTopicUnnamed` prop on the components.
 * @param topic The topic to check.
 * @returns True when the topic has no usable name.
 */
export const isTopicUnnamed = (topic: ChatTopic): boolean =>
    topic.name === undefined || topic.name.trim().length === 0;
