// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { AdapterInventoryEntry } from './adapter-inventory.mjs';

export interface WeightedUnit {
    readonly id: string;
    readonly weight: number;
}

export interface StoryMatrixUnit extends WeightedUnit {
    readonly cases: number;
    readonly adapterId?: string;
    readonly scopedToMatrix?: boolean;
    readonly appearance?: string;
}

export function buildUnits(params: {
    readonly inventory: {
        readonly adapters: readonly {
            readonly metadata: Pick<AdapterInventoryEntry['metadata'], 'id'>;
            readonly builtIn: boolean;
        }[];
    };
    readonly storyCount: number;
    readonly matrixStoryCount: number;
    readonly appearances: readonly string[];
}): StoryMatrixUnit[];

export function partition<T extends WeightedUnit>(units: readonly T[], n: number): T[][];
