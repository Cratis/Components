// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { components3PrimeReact11PassThroughContract } from './components3PrimeReact11PassThroughContract';

/** Attribute used to prove that a pass-through slot reached rendered output. */
export const primeReact11PassThroughSentinelAttribute = 'data-cratis-pt-slot';

type SentinelPresetNode = {
    [key: string]: SentinelPresetNode | string;
};

type SentinelPresetMap = Map<string, SentinelPresetMap | string>;

const nodeAt = (root: SentinelPresetMap, path: readonly string[]) => {
    let current = root;

    for (const segment of path) {
        const existing = current.get(segment);
        if (typeof existing === 'string') {
            throw new Error(`Cannot add pass-through entries below ${path.join('.')}.`);
        }

        const child = existing ?? new Map<string, SentinelPresetMap | string>();
        current.set(segment, child);
        current = child;
    }

    return current;
};

const toPresetNode = (source: SentinelPresetMap): SentinelPresetNode => {
    const entries = Array.from(
        source,
        ([key, value]) =>
            [key, value instanceof Map ? toPresetNode(value) : value] as const,
    );

    // SAFETY: Every Map value is recursively converted to the declared string-or-node shape.
    return Object.fromEntries(entries) as SentinelPresetNode;
};

const createSentinelPreset = () => {
    const preset: SentinelPresetMap = new Map();

    for (const [component, contract] of Object.entries(
        components3PrimeReact11PassThroughContract.components,
    )) {
        const target = nodeAt(preset, contract.globalKey.split('.'));

        for (const slot of contract.slots) {
            const slotTarget = nodeAt(target, [slot]);
            const existing = slotTarget.get(primeReact11PassThroughSentinelAttribute);
            const sentinel = `${component}.${slot}`;
            slotTarget.set(
                primeReact11PassThroughSentinelAttribute,
                typeof existing === 'string' ? `${existing} ${sentinel}` : sentinel,
            );
        }
    }

    return toPresetNode(preset);
};

/**
 * A non-visual PrimeReact 11 `pt` preset for compatibility tests.
 *
 * Apply this preset globally with `unstyled: true`, render the supported components and then call
 * {@link assertPrimeReact11PassThroughCompatibility}. The custom data attributes are intentionally
 * inert and can coexist with additional consumer pass-through entries.
 */
export const primeReact11PassThroughSentinelPreset =
    createSentinelPreset() as NonNullable<CratisComponentsConfig['pt']> &
        SentinelPresetNode;
