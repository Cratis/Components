// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChatTopic } from './ChatTopic';

/**
 * When a topic last saw something happen. Data that traveled through JSON may carry dates as
 * strings, so the value is coerced rather than trusted to be a `Date`.
 * @param topic The topic to read.
 * @returns The time of last activity, the start time when nothing happened since, or the epoch when neither is known.
 */
const lastActivityOf = (topic: ChatTopic): number => {
    const moment = topic.lastActivity ?? topic.started;
    if (moment === undefined) return 0;
    const time = moment instanceof Date ? moment.getTime() : new Date(moment).getTime();
    return Number.isNaN(time) ? 0 : time;
};

/**
 * The topics ordered by most recent activity first, so the conversation somebody is most likely
 * looking for sits on top. Non-mutating.
 * @param topics The topics in any order.
 * @returns A new array, most recently active first.
 */
export const topicsByActivity = <TTopic extends ChatTopic>(topics: TTopic[]): TTopic[] =>
    [...topics].sort((left, right) => lastActivityOf(right) - lastActivityOf(left));
