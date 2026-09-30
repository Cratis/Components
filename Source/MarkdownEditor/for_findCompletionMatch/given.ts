// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MarkdownCompletion } from '../MarkdownCompletion';

/**
 * A completion that never answers, for specs that only look at what is matched.
 * @param overrides What to change from a plain `#` completion.
 * @returns The completion.
 */
export const aCompletion = (overrides: Partial<MarkdownCompletion> = {}): MarkdownCompletion => ({
    trigger: '#',
    suggest: () => [],
    ...overrides,
});
