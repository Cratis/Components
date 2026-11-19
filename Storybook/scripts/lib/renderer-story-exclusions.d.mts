// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export interface RendererStoryExclusion {
    readonly tag: string;
    readonly slot: string;
    readonly reason: string;
}

export interface AdapterWithSlots {
    readonly builtIn: boolean;
    readonly metadata: { readonly id: string; readonly slots?: readonly string[] };
}

export const rendererStoryExclusions: readonly RendererStoryExclusion[];
export function storyExclusionsFor(adapter: AdapterWithSlots): readonly RendererStoryExclusion[];
export function describeStoryExclusions(adapters: readonly AdapterWithSlots[]): string;
