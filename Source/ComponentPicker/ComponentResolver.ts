// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Lets the host add context the library cannot know, for example a screen identity or the
 * application slice an element belongs to. Receives the picked component root.
 */
export type ComponentResolver = (element: Element) => Record<string, unknown> | undefined;
