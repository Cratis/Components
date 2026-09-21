// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export interface RendererMatrixStoryEntry {
    readonly id: string;
    readonly componentPath?: string;
    readonly importPath: string;
}

export interface RendererMatrixScope {
    readonly slotOwningModules: ReadonlySet<string>;
    readonly matrixStoryIds: ReadonlySet<string>;
    readonly componentMatrixMembership: ReadonlyMap<string, boolean>;
}

export function findSlotOwningModules(sourceRoot: string): ReadonlySet<string>;

export function computeRendererMatrixScope(params: {
    readonly storyEntries: readonly RendererMatrixStoryEntry[];
    readonly repositoryRoot: string;
    readonly sourceRoot: string;
}): RendererMatrixScope;
