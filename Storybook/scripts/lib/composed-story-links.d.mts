// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export function selectLinkStory(inventory: { readonly stories?: readonly string[] }): string;
export function managerStoryPath(refId: string, storyId: string, embed?: boolean): string;
export function previewStoryPath(refId: string, storyId: string): string;
